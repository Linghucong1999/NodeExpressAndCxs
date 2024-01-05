const BaseComponent = require('./baseComponent.js');


/**
 * 腾讯、百度地图API统一调用配件
 */

class AddressComponent extends BaseComponent {
    constructor() {
        super();
        this.baidukey = 'H4M0rI9fGBCs6DxZp3viPhdWYk4sKq1l';
        this.tencentkey = 'RR7BZ-3TC3V-TAOPK-5EEA6-QG3IS-VXFH4';
        this.tencentkey2 = 'W23BZ-WGFCW-5LAR2-3OGIT-GIZOT-JRBYG';
        this.tencentkey3 = 'S2XBZ-5VBKB-FO3UD-NSM3Q-GXXS2-VEF63';
        this.tencentkey4 = '3CLBZ-CTY3Q-JPJ5E-4EGWO-EEWFK-NCB3N';
    }


    //获取定位地址
    async guessPostion(req) {
        return new Promise(async (resolve, reject) => {
            let ip;
            const defaultIp = ['183.6.127.179', '122.234.134.158', '101.226.168.228', '180.164.56.112', '103.138.75.90', '202.106.186.34', '106.2.176.22', '221.4.220.238'];
            const randomIndex = Math.floor(Math.random() * defaultIp.length)
            if (process.env.NODE_ENV == 'development') {
                ip = defaultIp[randomIndex];
            } else {
                try {
                    //如果客户端使用了代理服务器，那么 X-Forwarded-For 头部中会包含多个 IP 地址，其中第一个 IP 地址就是客户端的真实 IP 地址 ==>req.headers['x-forwarded-for']?.split(',')[0] 
                    // 如果存在 X-Forwarded-For 头部，并且包含多个 IP 地址，选择第一个 IP 地址作为客户端的真实 IP 地址
                    const forwardedFor = req.headers['x-forwarded-for'];
                    if (forwardedFor) {
                        ip = forwardedFor.split(',')[0];
                    } else {
                        // 否则，使用 remoteAddress 获取客户端的 IP 地址
                        ip = req.socket.remoteAddress || req.connection.remoteAddress;
                    }
                    // 如果无法获取到任何 IP 地址，使用默认的 IP 地址列表中的一个 IP
                    ip = ip || defaultIp[randomIndex];
                } catch (err) {
                    ip = defaultIp[randomIndex];
                }
            }

            try {
                let result = await this.fetchDate('https://apis.map.qq.com/ws/location/v1/ip', { ip, key: this.tencentkey });

                if (result.status != 0) {
                    result = await this.fetchDate('https://apis.map.qq.com/ws/location/v1/ip', { ip, key: this.tencentkey2 });
                }

                if (result.status != 0) {
                    result = await this.fetchDate('https://apis.map.qq.com/ws/location/v1/ip', { ip, key: this.tencentkey3 });
                }

                if (result.status != 0) {
                    result = await this.fetchDate('https://apis.map.qq.com/ws/location/v1/ip', { ip, key: this.tencentkey4 });
                }

                if (result.status == 0) {
                    const cityInfo = {
                        lat: result.result.location.lat,
                        lng: result.result.location.lng,
                        city: result.result.ad_info.city
                    };
                    cityInfo.city = cityInfo.city.replace(/市$/, '');
                    resolve(cityInfo);
                } else {
                    console.log("ip定位", ip);

                    console.log('定位失败', result);
                    resolve(null);
                }
            } catch (err) {
                reject(err);
            }

        })
    }

    //搜索地址
    async searchPlace(keyword, cityName, type = 'search') {
        try {
            const resObj = await this.fetchDate('https://apis.map.qq.com/ws/place/v1/search', {
                boundary: 'region(' + encodeURIComponent(cityName) + ',1)',
                keyword: encodeURIComponent(keyword),
                page_size: 20,
                page_index: 1,
                key: this.tencentkey

            })
            if (resObj.status == 0) {
                return resObj;
            } else {
                throw new Error(resObj.message);
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    //测量距离
    async getDistance(from, to, type) {
        return new Promise(async (resolve, reject) => {
            try {
                let res;
                res = await this.fetchDate('https://apis.map.qq.com/ws/direction/v1/driving/', {
                    output: 'json',
                    from: from,
                    to: to,
                    key: this.tencentkey
                })
                // console.log(res.result);
                if (res.status === 0) {
                    let timevalue;
                    res.result.routes.forEach(item => {
                        timevalue = parseInt(item.duration) + 1200;   //1200是考虑一下环境因素，给个特定的经验值，每增加1.2公里就会额外增加20分钟，包括了等红灯等因素
                        let durationtime = Math.ceil(timevalue % 3600 / 60) + '分钟';
                        if (Math.floor(timevalue / 3600)) {
                            durationtime = Math.floor(timevalue / 3600) + '小时' + durationtime;
                        }

                        if (type == 'timevalue') {
                            resolve(timevalue)
                        } else {
                            resolve({
                                distance: item.distance,
                                order_lead_time: durationtime
                            })
                        }
                    })
                } else {
                    if (type == 'timevalue') {
                        resolve(2000);
                    } else {
                        throw new Error("调用腾讯地图测量距离失败");
                    }
                }
            } catch (err) {
                console.log('获取距离位置失败' + err);
                reject([]);
            }
        })

    }

    //通过IP地址获取精确位置
    async geocoder(req) {
        try {
            const address = await this.guessPostion(req);
            const params = {
                key: this.tencentkey,
                location: address.lat + ',' + address.lng
            };
            let res = await this.fetchDate('https://apis.map.qq.com/ws/geocoder/v1/', params);
            if (res.status != 0) {
                params.key = this.tencentkey2;
                res = await this.fetchDate('https://apis.map.qq.com/ws/geocoder/v1/', params);
            }
            if (res.status != 0) {
                params.key = this.tencentkey3;
                res = await this.fetchDate('https://apis.map.qq.com/ws/geocoder/v1/', params);
            }
            if (res.status != 0) {
                params.key = this.tencentkey4;
                res = await this.fetchDate('https://apis.map.qq.com/ws/geocoder/v1/', params);
            }

            if (res.status == 0) {
                return res;
            } else {
                throw new Error('获取具体位置信息失败');
            }
        } catch (err) {
            console.log('geocoder获取定位失败', err);
            throw new Error(err);
        }
    }

    //第二种精确定位法
    async getpois(lat, lng) {
        try {
            const params = {
                key: this.tencentkey,
                location: lat + ',' + lng
            };
            let res = await this.fetchDate('https://apis.map.qq.com/ws/geocoder/v1/', params);

            if (res.status != 0) {
                params.key = this.tencentkey2;
                res = await this.fetchDate('https://apis.map.qq.com/ws/geocoder/v1/', params);
            }
            if (res.status != 0) {
                params.key = this.tencentkey3;
                res = await this.fetchDate('https://apis.map.qq.com/ws/geocoder/v1/', params);
            }
            if (res.status != 0) {
                params.key = this.tencentkey4;
                res = await this.fetchDate('https://apis.map.qq.com/ws/geocoder/v1/', params);
            }
            if (res.status == 0) {
                return res;
            } else {
                throw new Error('通过geohash获取位置信息失败');
            }
        } catch (err) {
            console.log('getpois获取定位信息失败', err);
            throw new Error(err);
        }
    }

    //获取省市区列表
    async getDistrict(req) {
        try {
            let resault = await this.fetchDate('https://apis.map.qq.com/ws/district/v1/list', { key: this.tencentkey, output: 'json' });
            if (resault.status !== 0) {
                resault = await this.fetchDate('https://apis.map.qq.com/ws/district/v1/list', { key: this.tencentkey2, output: 'json' })
            }

            if (resault.status !== 0) {
                resault = await this.fetchDate('https://apis.map.qq.com/ws/district/v1/list', { key: this.tencentkey3, output: 'json' })
            }

            if (resault.status !== 0) {
                resault = await this.fetchDate('https://apis.map.qq.com/ws/district/v1/list', { key: this.tencentkey4, output: 'json' })
            }

            return resault;
        } catch (err) {
            console.log(err);
            throw new Error("获取省市区列表失败");
        }
    }

    //获取下级行政区划
    async getDistricChildern(id) {
        try {
            let resault = await this.fetchDate('https://apis.map.qq.com/ws/district/v1/getchildren', { key: this.tencentkey, id: id, output: 'json' });


            if (resault.status !== 0) {
                resault = await this.fetchDate('https://apis.map.qq.com/ws/district/v1/getchildren', { key: this.tencentkey2, id: id, output: 'json' });
            }

            if (resault.status !== 0) {
                resault = await this.fetchDate('https://apis.map.qq.com/ws/district/v1/getchildren', { key: this.tencentkey3, id: id, output: 'json' });
            }
            if (resault.status !== 0) {
                resault = await this.fetchDate('https://apis.map.qq.com/ws/district/v1/getchildren', { key: this.tencentkey4, id: id, output: 'json' });
            }

            return resault;
        } catch (err) {
            throw new Error("获取下级行政区域失败");
        }
    }


}

module.exports = AddressComponent;