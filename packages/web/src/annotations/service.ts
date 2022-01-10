import Vue from "vue";
import { ObjectFactory } from "./object-factory";

class ResponseHandler {
    public static queryHandler(
        service: Object,
        method: Function,
        option?: {
            title?: string;
            dataName?: string;
            showTip?: boolean;
            showErrorMsg?: boolean;
        }
    ) {
        return async (...arg: Array<any>) => {
            let {
                title = "",
                dataName = "",
                showTip = false,
                showErrorMsg = false
            } = option as any;
            
            try {
                let result = await method.call(service, ...arg);
                let msg: string;
                if (result.hasError) {
                    msg = title ? `${title}出错!` : "请求服务失败";
                    msg = showErrorMsg ? result.message : msg;
                    (showTip || showErrorMsg) &&
                        ResponseHandler.message.error(msg);
                    console.error(msg);
                    return result;
                }
                let data = dataName ? result[dataName] : result;
                if (
                    !data // ||
                    // (data.$isObject() && data.$isEmpty()) ||
                    // (data.$isArray() && data.$isEmpty()) ||
                    // (dataName === "" && result.result.$isEmpty())
                ) {
                    msg = `${title}无结果!`;
                    showTip && ResponseHandler.message.warning(msg);
                    console.warn(msg);
                }
                return data;
            } catch (error) {
                let msg = title ? `${title}出错!` : "请求服务失败";
                msg = showErrorMsg ? error.response?.data?.message || msg : msg;
                (showTip || showErrorMsg) && ResponseHandler.message.error(msg);
                console.error(msg, error);
            }
        };
    }

    public static saveHandler(
        service: Object,
        method: Function,
        option?: {
            title?: string;
            dataName?: string;
            showTip?: boolean;
            showErrorMsg?: boolean;
        }
    ) {
        let {
            title = "",
            dataName = "",
            showTip = false,
            showErrorMsg = false
        } = option as any;
        return async (...arg: Array<any>) => {
            try {
                let result = await method.call(service, ...arg);
                let msg: string;
                if (result.hasError) {
                    msg = title ? `${title}出错!` : "请求服务失败";
                    msg = showErrorMsg ? result.message : msg;
                    (showTip || showErrorMsg) &&
                        ResponseHandler.message.error(msg);
                    console.error(msg);
                    return result;
                }
                msg = title ? `${title}成功!` : "请求服务成功";
                showTip && ResponseHandler.message.success(msg);
                let data = dataName ? result[dataName] : result;
                return data;
            } catch (error) {
                let msg = title ? `${title}出错!` : "请求服务失败";
                msg = showErrorMsg ? error.response?.data?.message || msg : msg;
                (showTip || showErrorMsg) && ResponseHandler.message.error(msg);
                console.error(msg, error);
            }
        };
    }

    /**
     * 全局通知对象
     */
    public static get message() {
        return Vue.prototype.$message;
    }
}

/**
 *
 * @param serviveType 服务的类型 指的是服务是保存类(delete/update/save)操作save 还是查询类操作query
 * 根据这个类型来决定调用不同的ResponseHandler
 */
export default function service(
    serviveType: string,
    option?: {
        title?: string;
        dataName?: string;
        showTip?: boolean;
        showErrorMsg?: boolean;
    }
) {
    return function(target: any, name: any) {
        let method: Function = target[name];
        let handler =
            serviveType === "query"
                ? ResponseHandler.queryHandler
                : ResponseHandler.saveHandler;
        // let serviceName = target.constructor.name;
        // 这里改变是因为autowired中使用service示例本身作为key了 而不是使用service的类名
        let serviceName = target.constructor;
        let service: any = ObjectFactory.has(serviceName)
            ? ObjectFactory.get(serviceName)
            : ObjectFactory.create(target.constructor);
        Object.defineProperty(service, name, {
            get: function() {
                return handler(service, method, option);
            }
        });
        ObjectFactory.set(serviceName, service);
    };
}
