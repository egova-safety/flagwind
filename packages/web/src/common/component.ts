/*!
 * This file is part of `common` module.
 *
 * Authors:
 *      jason <jasonsoop@gmail.com>
 *
 * Licensed under the MIT License.
 * Copyright (C) 2010-2017 Flagwind Inc. All rights reserved.
 */

import Vue from "vue";
import flagwind from "@egova/flagwind-core";
import { LoadingBarConfig, Message, Notice, Spin, ModalInstance } from "view-design";
import iview from "../components/iview";
import { VueReceiver } from "./broadcast";

const components: any = iview;

/**
 * 定义组件的基础功能。
 * @class
 * @version 1.0.0
 */
export class Component extends Vue {

    protected $eventBus: flagwind.BroadcastManager | undefined;

    protected _eventNames: Array<string> = [];

    protected get $eventNames() {
        if (this._eventNames === undefined) {
            this._eventNames = [];
        }
        return this._eventNames;
    }

    /**
     * 获取默认服务容器实例。
     * @protected
     * @property
     * @returns flagwind.IServiceProvider
     */
    protected get serviceProvier(): flagwind.IServiceProvider {
        return flagwind.ServiceProviderFactory.instance.default;
    }

    /**
     * 获取一个全局加载条实例。
     * @returns LoadingBar
     */
    protected get $loading(): LoadingBarConfig {
        return components.LoadingBar;
    }

    /**
     * 获取一个全局消息提示框实例。
     * @returns Message
     */
    protected get $message(): Message {
        return components.Message;
    }

    /**
     * 获取一个全局模态框实例。
     * @returns Modal
     */
    protected get $modal(): ModalInstance {
        return components.Modal;
    }

    /**
     * 获取一个全局通知提醒实例。
     * @returns Notice
     */
    protected get $notice(): Notice {
        return components.Notice;
    }

    /**
     * 获取一个全局加载中组件实例。
     * @returns Spin
     */
    protected get $spin(): Spin {
        return components.Spin;
    }

    protected $subscribe(uri: string, fn: Function, priority?: number) {
        this.$eventNames.push(uri);
        let contract = new flagwind.BroadcastContract(uri);
        if (priority !== undefined) {
            contract.priority = priority;
        }
        (this.$eventBus || flagwind.BroadcastManager.instance).register(contract, new VueReceiver(this, fn));
    }

    protected $publish(uri: string, args?: any) {
        let map = new flagwind.Map<string, any>();
        if (args) {
            Object.keys(args).forEach(key => {
                map.set(key, args[key]);
            });
        }
        let broadcast = new flagwind.Broadcast(uri, map);

        let $this: any = this;
        do {
            let bus: flagwind.BroadcastManager = ($this.$eventBus || flagwind.BroadcastManager.instance);
            // let entries: flagwind.Map<string, any> = bus.receiverProvider._entries;
            if (bus.hasReceiver(broadcast.uri)) {
                bus.send(broadcast);
                break;
            } else {
                $this = $this.$parent;
            }
        }
        while ($this != null);
    }

    protected destroyed() {
        let bus = (this.$eventBus || flagwind.BroadcastManager.instance);
        if (this.$eventNames && this.$eventNames.length > 0) {
            this.$eventNames.forEach(uri => {
                bus.unregister(new flagwind.BroadcastContract(uri));
            });
            console.info("局部eventBus自动销毁");
        }
    }

}
