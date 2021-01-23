import flagwind from "@egova/flagwind-core";

export class EventBus extends flagwind.BroadcastManager {
    public id: string;
    public constructor(id: string) {
        super();
        this.id = id;
    }
}

export class VueReceiver implements flagwind.IBroadcastReceiver {
    private target: any;
    private method: Function;

    public constructor(target: any, fn: Function) {
        this.target = target;
        this.method = fn;
    }
    public receive(context: flagwind.BroadcastContext): void {
        this.method.apply(this.target, [context.extras]);
    }
}
