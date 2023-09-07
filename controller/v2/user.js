const AddressComponent = require('../../prototype/addressComponent.js');
const UserInfoModel = require('../../models/v2/userinfo.js');
const UserModel = require('../../models/v2/user.js');
const dtime = require('time-formater');
const bcrypt = require('bcryptjs');

//用户信息
class User extends AddressComponent {
    constructor() {
        super();
        this.login = this.login.bind(this);
        this.changePassword = this.changePassword.bind(this);
        this.updataAvatar = this.updataAvatar.bind(this);
    }
    // async encryption
    async login(req, res, next) {
        const cap = req.cookies.cap;
        if (!cap) {
            res.send({
                status: 0,
                type: 'ERROR_CAPTCHA',
                message: '验证码失败'
            })
            return
        }

        const { username, password, captcha_code } = req.body;
        try {
            if (!username) {
                throw new Error('用户名参数错误');
            } else if (!password) {
                throw new Error('密码参数出错');
            } else if (!captcha_code) {
                throw new Error('请输入验证码');
            }
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_QUERY',
                message: err.message
            })
            return
        }

        if (cap.toString() !== captcha_code.toString()) {
            res.send({
                status: 0,
                type: 'ERROR_CAPTCHA',
                message: '验证码不正确'
            })
            return
        }

        const salt = await bcrypt.genSalt(10);

        try {
            const user = await UserModel.findOne({ username });
            //如果用户名不存在直接创建一个新用户
            if (!user) {
                const newpassword = await bcrypt.hash(password, salt);
                const user_id = await this.getId('user_id');
                const cityInfo = await this.guessPostion(req);
                const registe_time = dtime().format('YYYY-MM-DD HH:mm');
                const newUser = { username, password: newpassword, user_id };
                const newUserInfo = { username, user_id, id: user_id, city: cityInfo.city, registe_time };

                UserModel.create(newUser);
                const createUser = new UserInfoModel(newUserInfo);
                const userinfo = await createUser.save();
                req.session.user_id = user_id;
                res.send({
                    status: 1,
                    success: '注册成功'
                });

            } else if (!(await bcrypt.compare(password, user.password))) {
                res.send({
                    status: 0,
                    type: 'ERROR_PASSWORD',
                    message: "密码错误"
                })
                return
            } else {
                req.session.user_id = user.user_id;
                res.send({
                    status: 1,
                    success: '登录成功'
                })
            }
        } catch (err) {
            console.log(err);
            res.send({
                status: 0,
                type: 'ERROR_USER_FAILED',
                message: '登录失败'
            })
        }

    }

    async getInfo(req, res, next) {
        const sid = req.session.user_id;

        const qid = req.query.user_id;
        const user_id = sid || qid;
        if (!user_id || !Number(user_id)) {
            res.send({
                status: 0,
                type: 'GET_USER_INFO_FAIELD',
                message: 'session出错'
            })
            return
        }

        try {
            const userinfo = await UserInfoModel.findOne({ user_id }, { _id: 0, __v: 0 });
            res.send(userinfo);
        } catch (err) {
            res.send({
                status: 0,
                type: 'GET_USER_INFO_FAIELD',
                message: '通过session获取用户信息失败'
            })
        }
    }

    async getInfoById(req, res, next) {
        const user_id = req.params.user_id;
        if (!user_id || !Number(user_id)) {
            res.send({
                status: 0,
                type: 'GET_USER_INFO_FAIELD',
                message: '通过用户Id获取用户信息出错'
            })
            return
        }

        try {
            const userinfo = await UserInfoModel.findOne({ user_id }, { _id: 0, __v: 0 });
            res.send(userinfo);
        } catch (err) {
            res.send({
                status: 0,
                type: 'GET_ADMIN_INFO_FAILED',
                message: '通过用户ID获取用户信息失败'
            })
        }
    }

    async signout(req, res, next) {
        delete req.session.user_id;
        res.send({
            status: 1,
            message: '退出成功'
        })
    }

    async changePassword(req, res, next) {
        const cap = req.cookies.cap;
        if (!cap) {
            res.send({
                status: 0,
                type: 'ERROR_CAPTCHA',
                message: '验证码失效'
            })
            return
        }

        const { username, oldpassword, newpassword, confirmpassword, captcha_code } = req.body;
        try {
            if (!username) {
                throw new Error('用户名不能为空');
            } else if (!oldpassword) {
                throw new Error('密码不能为空');
            } else if (!newpassword) {
                throw new Error('必须填写新密码');
            } else if (!confirmpassword) {
                throw new Error('必须再次填写新密码');
            } else if (!captcha_code) {
                throw new Error('没有填写验证码');
            }
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_QUERY',
                message: err.message
            })
            return
        }

        if (cap.toString() !== captcha_code.toString()) {
            res.send({
                status: 0,
                type: 'ERROR_CAPTCHA',
                message: '验证码不正确'
            })
            return
        }

        const salt = await bcrypt.genSalt(10);

        try {
            const user = await UserModel.findOne({ username });

            if (!user) {
                res.send({
                    status: 0,
                    type: 'USER_NOT_FOUND',
                    message: '未找到当前用户'
                })
            } else if (!bcrypt.compare(oldpassword, user.password)) {
                res.send({
                    status: 0,
                    type: 'ERROR_PASSWORD',
                    message: '密码错误'
                })
            } else if (newpassword !== confirmpassword) {
                res.send({
                    status: 0,
                    type: 'ERROR_NEWPASSWORD_CONFPASSWORD',
                    message: '输入新密码前后两次不相同'
                })
            } else {
                user.password = await bcrypt.hash(newpassword, salt);
                user.save();
                res.send({
                    status: 1,
                    message: '密码修改成功'
                })
            }
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_CHANGE_PASSWORD',
                message: '修改密码失败'
            })
        }
    }

    async getUserList(req, res, next) {
        const { limit = 20, offset = 0 } = req.query;
        try {
            const users = await UserInfoModel.find({}, { _id: 0, __v: 0 }).sort({ user_id: -1 }).limit(Number(limit)).skip(Number(offset));
            res.send(users);
        } catch (err) {
            res.send({
                status: 0,
                type: 'GET_DATA_ERROR',
                message: '获取用户列表'
            })
        }
    }

    async conditionGetUser(req, res, next) {
        const { username = '', city = '', registe_time = '', limit = 20, offset = 0 } = req.query;
        try {
            if (username !== '') {
                const user = await UserInfoModel.findOne({ username }, { _id: 0, __v: 0 });
                if (user !== null) {
                    res.send({
                        status: 1,
                        user
                    })
                } else {
                    res.send({
                        status: 0,
                        user: '根据用户查找,查无此人'
                    })
                }

            } else if (username === '' && registe_time !== '' && city !== '') {
                const users = await UserInfoModel.find({ registe_time: { $regex: new RegExp(`${registe_time}`, 'i') }, city: { $regex: `^${city}` } }, { _id: 0, __v: 0 }).limit(Number(limit)).skip(Number(offset));
                if (users.length !== 0) {
                    res.send({
                        status: 1,
                        user: users
                    })
                } else {
                    res.send({
                        status: 0,
                        user: '这段时间,这段地区,查无此人'
                    })
                }
            } else {
                res.send({
                    status: 0,
                    user: '查无此人'
                })
            }
        } catch (err) {
            res.send({
                status: 0,
                type: 'GET_ERROR_USER',
                message: '查询用户失败'
            })
        }
    }


    async getUserCount(req, res, next) {
        try {
            const count = await UserInfoModel.count();
            res.send({
                status: 1,
                count
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_TO_GET_USER_COUNT',
                message: '获取用户数量失败'
            })
        }
    }

    async updataAvatar(req, res, nest) {
        const sid = req.session.user_id;
        const pid = req.params.user_id;
        const user_id = sid || pid;
        if (!user_id || !Number(user_id)) {
            res.send({
                status: 0,
                type: 'ERROR_USERID',
                message: '用户id获取失败'
            })
            return
        }

        try {
            const image_path = await this.getPath(req);
            await UserInfoModel.findOneAndUpdate({ user_id }, { $set: { avatar: image_path } });
            res.send({
                status: 1,
                image_path
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_UPLOAD_IMG',
                message: '上传图片失败'
            })
        }


    }

    async getUserCity(req, res, next) {
        const cityArr = ['北京', '上海', '深圳', '广州'];
        const filterArr = [];
        cityArr.forEach(item => {
            filterArr.push(UserInfoModel.find({ city: item }).count());
        })

        filterArr.push(UserInfoModel.$where('!"北京上海深圳广州".includes(this.city)').count()) //统计不属于北上广深的城市
        Promise.all(filterArr).then(results => {
            res.send({
                status: 1,
                user_city: {
                    beijing: results[0],
                    shanghai: results[1],
                    shenzhen: results[2],
                    guangzhou: results[3],
                    other: results[4]
                }
            })
        }).catch(err => {
            res.send({
                status: 0,
                type: 'ERROR_GET_CITY',
                message: '获取用户分布失败'
            })
        })
    }
}

module.exports = new User();