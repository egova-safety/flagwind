/*!
 * Authors:
 *      jason <jasonsoop@gmail.com>
 *
 * Licensed under the MIT License.
 * Copyright (C) 2010-present Flagwind Inc. All rights reserved.
 */

import Vue from "vue";
import echarts from "echarts";
import debounce from "lodash.debounce";
import { component, config, watch, Component } from "@egova/flagwind-web";

const ACTION_EVENTS =
[
    "legendselectchanged",
    "legendselected",
    "legendunselected",
    "legendscroll",
    "datazoom",
    "datarangeselected",
    "timelinechanged",
    "timelineplaychanged",
    "restore",
    "dataviewchanged",
    "magictypechanged",
    "geoselectchanged",
    "geoselected",
    "geounselected",
    "pieselectchanged",
    "pieselected",
    "pieunselected",
    "mapselectchanged",
    "mapselected",
    "mapunselected",
    "axisareaselected",
    "focusnodeadjacency",
    "unfocusnodeadjacency",
    "brush",
    "brushselected"
];

const MOUSE_EVENTS =
[
    "click",
    "dblclick",
    "mouseover",
    "mouseout",
    "mousedown",
    "mouseup",
    "globalout"
];

/**
 * Echarts 组件。
 * @class
 * @version 1.0.0
 */
@component({template: require("./echarts.html")})
export default class ECharts extends Component
{
    private _chart?: echarts.ECharts;                        // ECharts 实例
    private _resizeHanlder: any;                            // 窗体大小发生变动时的处理函数

    /**
     * 获取或设置组件的宽度。
     * @public
     * @config
     * @description 单位为像素。如果传入值为 null/undefined/"auto"，则表示自动取 dom（实例容器）的宽度。
     * @returns number | string
     */
    @config({type: [Number, String]})
    public width?: number | string;

    /**
     * 获取或设置组件的高度。
     * @public
     * @config
     * @description 单位为像素。如果传入值为 null/undefined/"auto"，则表示自动取 dom（实例容器）的高度。
     * @returns number | string
     */
    @config({type: [Number, String]})
    public height?: number | string;

    /**
     * 获取或设置初始选项。
     * @public
     * @config
     * @description 有下面几个可选项：
     * devicePixelRatio?: number 设备像素比，默认取浏览器的值window.devicePixelRatio。
     * renderer?: string 渲染器，支持 "canvas" 或者 "svg"。
     * @returns Object
     */
    @config()
    public initOptions?: { devicePixelRatio?: number; renderer?: string};

    /**
     * 获取或设置配置选项。
     * @public
     * @config
     * @description 所有参数和数据的修改都可以通过设置 options 完成。
     * ECharts 会合并新的参数和数据，然后刷新图表。如果开启动画的话，ECharts 找到两组数据之间的差异然后通过合适的动画去表现数据的变化。
     * @returns echarts.EChartOption
     */
    @config()
    public options!: echarts.EChartOption;

    /**
     * 获取或设置应用的主题。
     * @public
     * @config
     * @description 可以是一个主题的配置对象，也可以是使用已经通过静态方法 registerTheme 注册的主题名称。
     * @returns string | Object
     */
    @config({type: [String, Object]})
    public theme?: string | Object;

    /**
     * 获取或设置用于联动的分组。
     * @public
     * @config
     * @returns string
     */
    @config()
    public group!: string;

    /**
     * 获取或设置一个布尔值，用于指示当窗口被调整大小时是否自动调整 ECharts 实例的大小。
     * @public
     * @config
     * @default false
     * @returns boolean
     */
    @config({default: false})
    public autoResize!: boolean;

    /**
     * 获取或设置一个布尔值，用于关闭 options 更改时默认的 deep 监测。
     * @public
     * @config
     * @default false
     * @returns boolean
     */
    @config({default: false})
    public watchShallow!: boolean;

    /**
     * 获取一个布尔值，表示 ECharts 实例是否已经被释放。
     * @public
     * @property
     * @returns boolean
     */
    public get isDisposed(): boolean
    {
        return !!this.dispathProperty("isDisposed", "isDisposed");
    }

    /**
     * 获取 ECharts 实例容器的宽度。
     * @public
     * @property
     * @returns number
     */
    public get computedWidth(): number
    {
        return this.dispathProperty("width", "getWidth");
    }

    /**
     * 获取 ECharts 实例容器的高度。
     * @public
     * @property
     * @returns number
     */
    public get computedHeight(): number
    {
        return this.dispathProperty("height", "getHeight");
    }

    /**
     * 获取 ECharts 实例维护的 options 对象。
     * @public
     * @property
     * @returns Object
     */
    public get computedOptions(): Object
    {
        return this.dispathProperty("computedOptions", "getOption");
    }

    /**
     * 设置 ECharts 实例的配置项以及数据。
     * @public
     * @param  {echarts.EChartOption} options 图表的配置项和数据，具体见配置项手册。
     * @param  {boolean} notMerge? 可选，是否不跟之前设置的option进行合并，默认为false，即合并。
     * @param  {boolean} lazyUpdate? 可选，在设置完option后是否不立即更新图表，默认为false，即立即更新。
     * @returns void
     */
    public mergeOptions(options: echarts.EChartOption, notMerge?: boolean, lazyUpdate?: boolean): void
    {
        this.dispathMethod("mergeOptions", "setOption", options, notMerge, lazyUpdate);
    }

    /**
     * 改变图表尺寸，在容器大小发生改变时需要手动调用。
     * @param  {number|string} width? 可显式指定实例宽度，单位为像素。如果传入值为 null/undefined/"auto"，则表示自动取 dom（实例容器）的宽度。
     * @param  {number|string} height? 可显式指定实例高度，单位为像素。如果传入值为 null/undefined/"auto"，则表示自动取 dom（实例容器）的高度。
     * @param  {boolean} silent? 是否禁止抛出事件。默认为 false。
     * @returns void
     */
    public resize(width?: number | string, height?: number | string, silent?: boolean): void
    {
        this.dispathMethod("resize", "resize", {width, height, silent});
    }

    /**
     * 触发图表行为，例如图例开关 legendToggleSelect, 数据区域缩放 dataZoom，显示提示框 showTip 等等，更多见 action 和 events 的文档。
     * @public
     * @param  {Object} payload 该参数可以通过batch属性同时触发多个行为。
     * @returns void
     */
    public dispatchAction(payload: Object): void
    {
        this.dispathMethod("dispatchAction", "dispatchAction", payload);
    }

    /**
     * 转换坐标系上的点到像素坐标值。
     * @public
     * @param  {Object} finder 用于指示『使用哪个坐标系进行转换』，通常地，可以使用 index 或者 id 或者 name 来定位。
     * @param  {string|Array<any>} value 要被转换的值。
     * @returns string | Array<any> 转换的结果为像素坐标值，以 ECharts 实例的 dom 节点的左上角为坐标 [0, 0] 点。
     */
    public convertToPixel(finder: {seriesIndex?: number; seriesId?: string; seriesName?: string; geoIndex?: number; geoId?: string; geoName?: string; xAxisIndex?: number; xAxisId?: string; xAxisName?: string; yAxisIndex?: number; yAxisId?: string; yAxisName?: string; gridIndex?: number; gridId?: string; gridName?: string } | string, value: string | Array<any>): string | Array<any>
    {
        return this.dispathMethod("convertToPixel", "convertToPixel", finder, value);
    }

    /**
     * 转换像素坐标值到逻辑坐标系上的点。是 convertToPixel 的逆运算。 具体实例可参考 convertToPixel。
     * @public
     * @param  {Object} finder 用于指示『使用哪个坐标系进行转换』。通常地，可以使用 index 或者 id 或者 name 来定位。
     * @param  {Array<any>|string} value 要被转换的值，为像素坐标值，以 ECharts 实例的 dom 节点的左上角为坐标 [0, 0] 点。
     * @returns string | Array<any> 转换的结果，为逻辑坐标值。
     */
    public convertFromPixel(finder: {seriesIndex?: number; seriesId?: string; seriesName?: string; geoIndex?: number; geoId?: string; geoName?: string; xAxisIndex?: number; xAxisId?: string; xAxisName?: string; yAxisIndex?: number; yAxisId?: string; yAxisName?: string; gridIndex?: number; gridId?: string; gridName?: string } | string, value: Array<any> | string): Array<any> | string
    {
        return this.dispathMethod("convertFromPixel", "convertFromPixel", finder, value);
    }

    /**
     * 判断给定的点是否在指定的坐标系或者系列上。
     * @description 目前支持在这些坐标系和系列上进行判断：grid, polar, geo, series-map, series-graph, series-pie。
     * @public
     * @param  {Object} finder 用于指示『在哪个坐标系或者系列上判断』。通常地，可以使用 index 或者 id 或者 name 来定位。
     * @param  {Array<any>} value 要被判断的点，为像素坐标值，以 ECharts 实例的 dom 节点的左上角为坐标 [0, 0] 点。
     * @returns boolean
     */
    public containPixel(finder: {seriesIndex?: number; seriesId?: string; seriesName?: string; geoIndex?: number; geoId?: string; geoName?: string; xAxisIndex?: number; xAxisId?: string; xAxisName?: string; yAxisIndex?: number; yAxisId?: string; yAxisName?: string; gridIndex?: number; gridId?: string; gridName?: string } | string, value: Array<any>): boolean
    {
        return this.dispathMethod("containPixel", "containPixel", finder, value);
    }

    /**
     * 显示加载动画效果。可以在加载数据前手动调用改接口显示加载动画，在数据加载完成后调用 hideLoading 隐藏加载动画。
     * @public
     * @param  {string} type? 可选，加载动画类型，目前只有一种 "default"。
     * @param  {Object} options? 加载动画配置项，跟type有关，下面是默认配置项：
     * @returns void
     */
    public showLoading(type?: string, options?: Object): void
    {
        this.dispathMethod("showLoading", "showLoading", type, options);
    }

    /**
     * 隐藏动画加载效果。
     * @public
     * @returns void
     */
    public hideLoading(): void
    {
        this.dispathMethod("hideLoading", "hideLoading");
    }

    /**
     * 导出图表图片，返回一个 base64 的 url。
     * @public
     * @param  {Object} options
     * @description
     * type?: string 导出的格式，可选 png, jpeg。
     * pixelRatio? number 导出的图片分辨率比例，默认为 1。
     * backgroundColor? string 导出的图片背景色，默认使用 options 里的 backgroundColor。
     * excludeComponents? Array<string> 忽略组件的列表，例如要忽略 toolbox 就是 ["toolbox"]。
     * @returns string
     */
    public getDataUrl(options: {type?: string; pixelRatio?: number; backgroundColor?: string; excludeComponents?: Array<string>}): string
    {
        return this.dispathMethod("getDataUrl", "getDataURL", options);
    }

    /**
     * 导出联动的图表图片，返回一个 base64 的 url
     * @description 导出图片中每个图表的相对位置跟容器的相对位置有关。
     * @public
     * @param  {Object} options
     * type?: string 导出的格式，可选 png, jpeg。
     * pixelRatio? number 导出的图片分辨率比例，默认为 1。
     * backgroundColor? string 导出的图片背景色，默认使用 options 里的 backgroundColor。
     * excludeComponents? Array<string> 忽略组件的列表，例如要忽略 toolbox 就是 ["toolbox"]。
     * @returns string
     */
    public getConnectedDataUrl(options: {type?: string; pixelRatio?: number; backgroundColor?: string; excludeComponents?: Array<string>}): string
    {
        return this.dispathMethod("getConnectedDataUrl", "getConnectedDataURL", options);
    }

    /**
     * 清空当前实例，会移除实例中所有的组件和图表。
     * @public
     * @returns void
     */
    public clear(): void
    {
        this.dispathMethod("clear", "clear");
    }

    /**
     * 销毁实例，销毁后实例无法再被使用。
     * @public
     * @returns void
     */
    public dispose(): void
    {
        this.dispathMethod("dispose", "dispose");
    }

    /**
     * 准备创建组件时调用的钩子方法。
     * @protected
     * @override
     * @returns void
     */
    protected created(): void
    {
        // 监听 "options" 选项变动
        this.$watch("options", (options: echarts.EChartOption) =>
        {
            if(!this._chart && options)
            {
                this.initialize();
            }
            else
            {
                this._chart!.setOption(options);
            }

        }, ({ deep: !this.watchShallow }));

        // 监听尺寸选项变动
        let size = ["width", "height"];

        for(let prop of size)
        {
            this.$watch(prop, () =>
            {
                this.resize(this.width, this.height);

            }, { deep: true});
        }

        // 监听其他选项变动
        let watched = ["theme", "initOptions", "autoResize", "watchShallow"];

        for(let prop of watched)
        {
            this.$watch(prop, () =>
            {
                this.refresh();

            }, { deep: true});
        }
    }

    /**
     * 创建组件时调用的钩子方法。
     * @protected
     * @override
     * @returns void
     */
    protected mounted(): void
    {
        if(this.options)
        {
            this.initialize();
        }
    }

    /**
     * 组件激活时调用的钩子方法。
     * @protected
     * @override
     * @returns void
     */
    protected activated(): void
    {
        if(this.autoResize)
        {
            this._chart && this._chart.resize();
        }
    }

    /**
     * 销毁组件之前调用的钩子方法。
     * @protected
     * @override
     * @returns void
     */
    protected beforeDestroy(): void
    {
        if(!this._chart)
        {
            return;
        }

        this.destroy();
    }

    /**
     * 当 "group" 属性发生改变时调用。
     * @protected
     * @returns void
     */
    @watch("group")
    protected onGroupChange(group: string): void
    {
        (<any>this._chart!).group = group;
    }

    /**
     * 初始化 ECharts。
     * @private
     * @returns void
     */
    private initialize(): void
    {
        if(this._chart)
        {
            return;
        }

        let initOptions: any = this.initOptions || {};

        // 设置初始尺寸
        if(this.width && this.height)
        {
            initOptions.width = this.width;
            initOptions.height = this.height;
        }

        // 初始化 ECharts
        let chart = echarts.init(this.$el as HTMLDivElement, this.theme, initOptions);

        // 设置分组
        if(this.group)
        {
            chart.group = this.group;
        }

        // 设置选项
        chart.setOption(this.options!, true);

        // 转发 ECharts 事件
        for(let event of [...ACTION_EVENTS, ...MOUSE_EVENTS])
        {
            chart.on(event, (args: any) =>
            {
                this.$emit(event, args);
            });
        }

        if(this.autoResize)
        {
            this._resizeHanlder = debounce(() =>
            {
                chart.resize();

            }, 100, { leading: true });

            window.addEventListener("resize", this._resizeHanlder);
        }

        this._chart = chart;
    }

    /**
     * 销毁 ECharts。
     * @private
     * @returns void
     */
    private destroy(): void
    {
        if(this.autoResize)
        {
            window.removeEventListener("resize", this._resizeHanlder);
        }

        this.dispose();

        this._chart = undefined;
    }

    /**
     * 刷新 ECharts。
     * @private
     * @returns void
     */
    private refresh(): void
    {
        this.destroy();

        this.initialize();
    }

    /**
     * 转发方法调用至 ECharts 实例中。
     * @private
     * @param  {string} name 方法名称。
     * @param  {string} method ECharts 方法名。
     * @param  {Array<any>} ...args ECharts 方法参数。
     * @returns any
     */
    private dispathMethod(name: string, method: string, ...args: Array<any>): any
    {
        if(!this._chart)
        {
            (<any>Vue)["util"].warn(`Cannot call [${name}] before the chart is initialized. Set prop [options] first.`, this);

            return;
        }

        return (<any>this._chart!)[method](...args);
    }

    /**
     * 转发属性调用至 ECharts 实例中。
     * @private
     * @param  {string} name 属性名称。
     * @param  {string} method  ECharts 方法名。
     * @returns any
     */
    private dispathProperty(name: string, method: string): any
    {
        if(!this._chart)
        {
            (<any>Vue)["util"].warn(`Cannot get [${name}] before the chart is initialized. please set config [options] first.`, this);

            return;
        }

        return (<any>this._chart!)[method]();
    }

    /**
     * 多个图表实例实现联动。
     * @public
     * @static
     * @param  {string|Array<any>} group 分组的 id，或者图表实例的数组。
     * @returns void
     */
    public static connect(group: string | Array<any>): void
    {
        echarts.connect(group);
    }

    /**
     * 解除图表实例的联动，如果只需要移除单个实例，可以将通过将该图表实例 group 设为空。
     * @public
     * @static
     * @param  {string} group 分组的 id。
     * @returns void
     */
    public static disconnect(group: string): void
    {
        echarts.disConnect(group);
    }

    /**
     * 注册可用的地图，必须在包括 geo 组件或者 map 图表类型的时候才能使用。
     * @public
     * @static
     * @param  {string} mapName 地图名称，在 geo 组件或者 map 图表类型中设置的 map 对应的就是该值。
     * @param  {Object} geoJson  GeoJson 格式的数据，具体格式见 http://geojson.org/。
     * @param  {Object} specialAreas? 将地图中的部分区域缩放到合适的位置，可以使得整个地图的显示更加好看。
     * @returns void
     */
    public static registerMap(mapName: string, geoJson: Object, specialAreas?: Object): void
    {
        echarts.registerMap(mapName, geoJson, specialAreas);
    }

    /**
     * 获取已注册的地图。
     * @public
     * @static
     * @param  {string} mapName 地图名称。
     * @returns Object
     */
    public static getMap(mapName: string): Object
    {
        return echarts["getMap"](mapName);
    }

    /**
     * 注册主题，用于初始化实例的时候指定。
     * @public
     * @static
     * @param  {string} themeName 主题名称。
     * @param  {Object} theme 主题数据。
     * @returns void
     */
    public static registerTheme(themeName: string, theme: Object): void
    {
        echarts.registerTheme(themeName, theme);
    }
}
