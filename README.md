## 使用文档

### 事件参数未定义全，随着连调进行，会随时同步更新本文档

#### 第一步 引入资源
```sh
页面引入 video-call-center.min.css
页面引入 video-call-center-vendors.min.js (必须在video-call-center.min.js之前引入)
页面引入 video-call-center.min.js
```

#### 第二步 使用

##### 初始化
```sh
 初始化
 VideoCallCenter.init(opts);
```
* opts

| opts |      type      | 说明|
|:-------------:|:------------------:|:--------------:|
| id|  text      |登录ID|
| token    |    text        |登录token|
| audio    |    boolean        |是否打开音频 true：打开 false：关闭|
| video    |    boolean        |是否打开视频 true：打开 false：关闭|
| width    | text      |视屏弹窗宽度（'800px'）|
| height    | text      |视屏弹窗高度（'500px'）|
| serverUrl    | text      |呼叫中心后台地址|
| socketUrl    | text      |呼叫中心后台socket地址|
| initCallBack| function      |初始化回调|

* 初始化回调返回参数说明

| result |      type      | 说明|
|:-------------:|:------------------:|:--------------:|
| code|  状态码      |200：成功， 500： 失败|
| msg    |    text        |初始化成功或失败消息对象|

##### 发送消息
```sh
 VideoCallCenter.sendMessage(msg, callBack);
```
*msg

| msg |      type      | 说明|
|:-------------:|:------------------:|:--------------:|
| cid|  text      |客户端ID|
| entry    |    text        |待发送的消息|

* callBack

发送消息成功或失败回调
| result |      type      | 说明|
|:-------------:|:------------------:|:--------------:|
| code|  状态码      |200：成功， 500： 失败|
| msg    |    text        |成功或失败消息|

##### 设置服务状态
```sh
 VideoCallCenter.setAgentStatus(status, callBack);
```
*status

| status |      type      | 说明|
|:-------------:|:------------------:|:--------------:|
| status|  number      |0：不可服务， 1：可服务|

* callBack

设置状态回调

| result |      type      | 说明|
|:-------------:|:------------------:|:--------------:|
| code|  状态码      |200：成功， 500： 失败|
| msg    |    text        |成功或失败消息|


##### 退出
```sh
 VideoCallCenter.logout(opts);
```
* opts

| opts |      type      | 说明|
|:-------------:|:------------------:|:--------------:|
| logoutCallBack| function      |登出回调|

* 初始化回调返回参数说明

| result |      type      | 说明|
|:-------------:|:------------------:|:--------------:|
| code|  状态码      |200：成功， 500： 失败|
| msg    |    text        |登出成功或失败消息对象|

##### 事件监听

```sh
 VideoCallCenter.on(eventType, callBack);
 
 eventType： 订阅事件名称
 callBack：  订阅事件回调
 
```
##### 参数说名
* eventType

| eventType名称 |      说明      |
|:-------------:|:------------------:|
| onCallComing|  呼叫进入      |
| onCallEnd    |    呼叫挂断        |
| onCallEndAll    | 呼叫结束      |
| onCallAnswered    | 接听呼叫      |
| onCallMute    | 呼叫静音      |
| message| 接收消息      |
| onShow| 呼叫中心弹框显示      |
| onHide| 呼叫中心弹框隐藏      |
| onCurrentCall| 当前视频通话中的call      |


* onCallComing 消息回调参数参数

| cid |      客户id      |
|:-------------:|:------------------:|
| sid |      对话id      |
| aid |      客服id      |
| extra |      C端数据      |

* onCallEnd 消息回调参数参数

| cid |      客户id      |
|:-------------:|:------------------:|
| sid |      对话id      |
| aid |      客服id      |
| extra |      C端数据      |

* onCallEndAll 消息回调参数参数

| code |      200 (呼叫结束，视频弹框消失)     |
|:-------------:|:------------------:|

* onCallMute 消息回调参数参数

| cid |      客户id      |
|:-------------:|:------------------:|
| sid |      对话id      |
| aid |      客服id      |
| extra |      C端数据      |

* onCurrentCall 消息回调参数参数

| cid |      客户id      |
|:-------------:|:------------------:|
| sid |      对话id      |
| aid |      客服id      |
| extra |      C端数据      |





