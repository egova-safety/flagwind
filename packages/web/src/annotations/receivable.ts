import flagwind from "@egova/flagwind-core";
import Vue from "vue";

/**
 *
 * @param uri 标注当前类型是一个广播接收器。
 * @param options 可选参数
 */
export default function receivable(uri: string, options: { priority?: number; scope?: string; repeat?: number } = { scope: "self", priority: 0, repeat: 0 }) {
    if (!uri) {
        throw new flagwind.InvalidOperationException("The broadcast uri is empty.");
    }

    return function (target: any, name: any, descriptor: any) {
        let mounted = target.mounted;
        target.mounted = function () {
            let $this: Vue | any = this;
            if (options.scope === "parent") {
                $this = $this?.$parent;
                let lv = Math.max(options.repeat || 0, 0);
                while (lv > 0 && $this?.$parent) {
                    $this = $this?.$parent;
                    lv--;
                }
            } else if (options.scope === "root") {
                $this = $this.$root;
            }
            if ($this.$flagwinEventBus === undefined) {
                $this.$flagwinEventBus = new flagwind.BroadcastManager();
            }
            this.$subscribe(uri, descriptor.value, options.priority);
            if (mounted) {
                mounted.apply(this);
            }
        };
    };
}
