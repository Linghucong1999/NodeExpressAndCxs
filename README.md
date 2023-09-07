# vue3-elm-server
基于Node.js的web框架Express.js，数据库使用Mongodb开发的一款web服务器

[厨生鲜后台管理系统](https://github.com/Linghucong1999/Vue3-CXSH)

## 文档后续项目写完会逐渐完善
每次 **commit** 我都会说明具体哪里改动，那里完善都会做详细的说明，所以目前只能先这样，开发时间太短，时间太赶了。

## 用户上传图片后端修改历程
最初版是使用  [gm](https://www.npmjs.com/package/gm),毕竟 gm 的处理图片人家也是专业的，本着这个原则，结果 &#x1F494; First download and install [GraphicsMagick](http://www.graphicsmagick.org/) or [ImageMagick](https://imagemagick.org/script/download.php)。
我想着直接npm一下，下载这两个处理器，再配置 gm。结果发现，人家 要在配置本地环境&#x26C4;

我放弃了使用 [gm](https://www.npmjs.com/package/gm)，结果很好，我在社区里发现了 [sharp](https://www.npmjs.com/package/sharp)，也是处理图片的；
引用官方的说法：<font color=red size=4 face="微软雅黑">The typical use case for this high speed Node.js module is to convert large images in common formats to smaller, web-friendly JPEG, PNG, WebP, GIF and AVIF images of varying dimensions.</font>

**最最重要的**<font color=red size=4 face="微软雅黑">不需要安装其他处理器</font>
```shell
npm i sharp --save
```
直接开箱使用，&#x1F349;舒服；

## 用户上传图片处理中
因为sharp是需要两个目录处理图片，然后我这边也是需要使用了 `fs.rename` 去修改用户上传图片的名称，原始代码如下：
```JavaScript
fs.rename(files.file.filepath, repath, (err) => {
                        if (err) throw new Error(err);
         });
const newRepath = './public/img/' + fullName;
shrap(repath)
    .resize(200, 200, { fit: sharp.fit.inside })
    .toFile(newRepath, (err, info) => {
            if (err) {
                    fs.unlinkSync(repath);
                    reject(err);
                    console.log(err);
            } else {
                    fs.unlinkSync(repath);
                    resolve(fullName);
                    };
    })
```
就会出现时不时的报错，说目录位置找不到什么的，我就奇怪为什么目录文件会找不到。找了好一会，发现，好像 `fs.rename` 是异步的&#x1F4A1;
```JavaScript
fs.rename(files.file.filepath, repath, (err) => {
                        if (err) throw new Error(err);
                        const newRepath = './public/img/' + fullName;
                        shrap(repath)
                            .resize(200, 200, { fit: sharp.fit.inside })
                            .toFile(newRepath, (err, info) => {
                                if (err) {
                                    fs.unlinkSync(repath);
                                    reject(err);
                                    console.log(err);
                                } else {
                                    fs.unlinkSync(repath);
                                    resolve(fullName);
                                };
                            })
                    });
```

## &#x1F353;关于开发用户API历程
对于用户登录操作中生成的验证码，我这边服务器是挂载在cookie上传输给客户端&#x1F463;

```JavaScript
res.cookie('cap', cap, { maxAge: 300000, httpOnly: true });
```
然后生成验证码这个流程的照片使用base64，主要是用了captchapng这个包，我目前理解的也是这个包了，简单方便快捷

```
npm i captchapng --save
```

## 关于处理使用腾讯地图API控制并发量请求处理

在个体用户中，腾讯API的并发请求只能每秒5次，那这么就限制我们开发，对于大量数据如何做到并发控制是我们需要考虑的；

&#x1F349; **外同步，内异步，进栈入栈思想**

外层循环时同步，把数据压入规定的长度的数组里面，然后这个数组里面的数据就是异步请求，达到控制并发量的效果;
```JavaScript
let position = [];
const maxCourrent = 5;  //并发量最大次数限制
//获取地图API测量距离
let count = 0;
let quernArr = [];
let results;
for (const [indexList, itemList] of restaurants.entries()) {
    quernArr.push(itemList);
}
```
这时候判断是否满足并发限制
```JavaScript
let position = [];
const maxCourrent = 5;  //并发量最大次数限制
//获取地图API测量距离
let count = 0;
let quernArr = [];
let results;
for (const [indexList, itemList] of restaurants.entries()) {
    quernArr.push(itemList);
    if (count % maxCourrent === 0) {
        results = quernArr.map(async (item, index) => {
                const to = item.latitude + ',' + item.longitude;
                const distance = await this.getDistance(from, to);
                return distance;
        })
        position.push(results);
        quernArr = [];
        count = 0;
        await new Promise(resolve => setTimeout(resolve, 1000));    //需要等待一秒，因为后续有后续的数据进入
    }
}
```
对于如果最后不满足并发限制的数据另外执行，同时最后就对返回的`Promise`统一执行一次`Promise.all()`
```JavaScript
let position = [];
const maxCourrent = 5;  //并发量最大次数限制
//获取地图API测量距离
let count = 0;
let quernArr = [];
let results;
for (const [indexList, itemList] of restaurants.entries()) {
    quernArr.push(itemList);
    if (count % maxCourrent === 0) {
        results = quernArr.map(async (item, index) => {
            const to = item.latitude + ',' + item.longitude;
            const distance = await this.getDistance(from, to);
            return distance;
        })
        position.push(results);
        quernArr = [];
        count = 0;
        await new Promise(resolve => setTimeout(resolve, 1000));    //需要等待一秒，因为后续有后续的数据进入
    }else if (count < maxCourrent && indexList === restaurants.length - 1) {
            results = quernArr.map(async (item, index) => {
                const to = item.latitude + ',' + item.longitude;
                const distance = await this.getDistance(from, to);
                return distance;
            })
            position.push(results);
            quernArr = [];
    }
    count++;
}

position.forEach(async (item, index) => {
    Promise.all(position[index]).then(res => {
                console.log(res);
        }).catch(err => {
                console.log(err);
    })
})
```
## &#x1F349; 对于为什么要在后端服务器做分页查询做解释说明&#x1F341;

本来想着，把所有用户数据全部都调度到前端，前端做保存，让前端自己做好分页查询。但是突然想到，如果全部数据都返回给前端，这个很容易就照成页面的卡顿，包括流畅性的损失，能把一切怪罪到用户网络性能的问题上我们就要把这个问题抛回给用户，前端工作量也可以减少，只是对于服务器的压力可能就大了&#x1F341;，可是Node.js就是做高并发的，前端没吃点击下一页就请求一次服务器，但是我服务器好不就行了？加钱，通通加钱，服务器好了，用户体验不也就好了&#x1F341;。包括对于数据库也好了，后端无非就是个limit 、 offset 的问题，湿湿碎啦&#x1F34E;
