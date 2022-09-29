

import component, { mixins } from "vue-class-component";
import { Prop as config, Model as model, Watch as watch, Inject as inject, Provide as provide, PropSync as propSync } from "vue-property-decorator";

// 注册路由相关钩子函数
component.registerHooks
    ([
        "beforeRouteEnter",
        "beforeRouteLeave",
        "beforeRouteUpdate"
    ]);

export { component, mixins, config, model, watch, inject, provide, propSync };
