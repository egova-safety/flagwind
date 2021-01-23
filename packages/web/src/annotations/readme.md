# 装饰器

## autowired 注解

与java的autowired注解类型，用于注入无参的构建方法的服务。使用

class Demo {

    @autowired(PolicecarService)
    public policecarService: PolicecarService;
}

## receivable 注解

该注解是基于 `flagwind-core` 广播机制 实现的一个接收器自动注册注解方式的实现，

### 如何订阅

```base
@component({template: require("./index.html")})
export default class SubscribeView extends View {

    @receivable("catalog://refresh-tree", { scope: "parent", priority: 1 })
    public subscribe(map?: flagwind.Map<string, any>) {
        // todo:
        console.log(map.get("id"));
    }
}
```

### 如何发布

```base
@component({template: require("./index.html")})
export default class PublishView extends View {


    public publish() {
      // 发布刷新树消息
     this.$publish("catalog://refresh-tree", { id: res.tag });
    }
}
```

注意：
> uri格式须严格遵循 ```${scheme}://${action}``` 这种格式，否则会注册不成功。
