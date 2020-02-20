# 说明

该项目是把flagwind-core 、flagwind-web、 flagwind-echarts 三个前端工程使用lerna技术整合在一起，以便对其进行版本管理和快速发布。部分内容在原有项目上做了稍微调整和依赖升级操作。

## 如何使用

1. 安装

```bash
lerna bootstrap
```

2. 编译

```bash
lerna run dist
```

3. 发布

```bash
lerna publish
```
