
import NumberCounter from "./number-counter";
const components: any = {
    NumberCounter
};

// tslint:disable-next-line:variable-name
const install = function(Vue: any, opts: any = {}) {
    Object.keys(components).forEach(key => {
        // flagwind 组件统一加小写 "fw" 标识
        // 最终在模板中使用组件时以类似 "fw-number-counter" 方式引用
        Vue.component("fw" + key, components[key]);
    });
};

export { NumberCounter };

export default { ...components, install };
