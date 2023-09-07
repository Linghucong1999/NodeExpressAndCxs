const AdminModel = require('../../models/admin/admin.js');
const AddressComponent = require('../../prototype/addressComponent.js');
const bcrypt = require('bcryptjs');
const formidable = require('formidable');
const dtime = require('time-formater');

class AdminAxios extends AddressComponent {
    constructor() {
        super();
        this.login = this.login.bind(this);
        this.register = this.register.bind(this);
        this.updataAvatar = this.updataAvatar.bind(this);
    }

    async login(req, res, next) {
        const { user_name, password, status = 1 } = req.body;
        try {
            if (!user_name) {
                throw new Error('用户名参数错误');
            } else if (!password) {
                throw new Error('密码参数错误');
            }
        } catch (err) {
            res.send({
                status: 0,
                type: 'GET_ERROR_PARAM',
                message: err.message
            })
            return
        }

        const salt = await bcrypt.genSalt(10);

        try {
            const admin = await AdminModel.findOne({ user_name });
            if (!admin) {
                const newpassword = await bcrypt.hash(password, salt);
                const adminTip = status == 1 ? '管理员' : '超级管理员';
                const admin_id = await this.getId('admin_id');
                const cityInfo = await this.guessPostion(req);
                const newAdmin = {
                    user_name,
                    password: newpassword,
                    id: admin_id,
                    creat_time: dtime().format('YYYY-MM-DD HH:mm'),
                    admin: adminTip,
                    status,
                    city: cityInfo.city
                }
                await AdminModel.create(newAdmin);
                req.session.admin_id = admin_id;
                res.send({
                    status: 1,
                    success: '注册管理员成功'
                })
                return
            } else if (!(await bcrypt.compare(password, admin.password))) {
                res.send({
                    status: 0,
                    type: 'ERROR_PASSWORD',
                    message: '该用户已存在,密码错误'
                })
                return
            } else {
                req.session.admin_id = admin.id;
                res.send({
                    status: 1,
                    success: '登录成功',
                })
            }
        } catch (err) {
            console.log(err);
            res.send({
                status: 0,
                type: 'ERROR_ADMIN_FAILED',
                message: '登录失败'
            })
        }

    }
    async register(req, res, next) {

    }

    async getAlladmin(req, res, next) {
        const { limit = 20, offset = 0 } = req.query
        try {
            const allAdmin = await AdminModel.find({}, { _id: 0, password: 0 }).sort({ id: -1 }).skip(Number(offset)).limit(Number(limit));
            res.send({
                status: 1,
                data: allAdmin
            })
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROP_GET_ADMIN_LIST',
                message: '获取管理员列表失败'
            })
        }
    }

    async getAdminInfo(req, res, next) {
        const admin_id = req.session.admin_id;
        if (!admin_id || !Number(admin_id)) {
            res.send({
                status: 0,
                type: 'ERROR_SESSION',
                message: '获取指定管理员失败'
            })
            return
        }

        try {
            const info = await AdminModel.findOne({ id: admin_id }, { _id: 0, password: 0, __v: 0 });
            if (!info) {
                throw new Error('未找到当前管理员')
            } else {
                res.send({
                    status: 1,
                    data: info
                })
            }
        } catch (err) {
            res.send({
                status: 0,
                type: 'GET_ADMIN_INFO_FAILED',
                message: '当前管理员获取失败'
            })
        }
    }

    async singout(req, res, next) {
        try {
            await req.session.destroy(err => {
                if (err) {
                    res.send({
                        status: 0,
                        message: '退出失败'
                    })
                } else {
                    res.setHeader('Set-Cookie', 'connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
                    res.send({
                        status: 1,
                        success: '退出成功'
                    })
                }
            })
        } catch (err) {
            res.send({
                status: 0,
                message: '退出失败'
            })
        }
    }

    async getAdminCount(req, res, next) {
        try {
            const count = await AdminModel.count();
            res.send({
                status: 1,
                count
            })
        } catch (err) {
            res.send({
                status: 0,
                message: '获取管理员数量失败'
            })
        }
    }

    async updataAvatar(req, res, next) {
        const qid = req.params.admin_id;
        const sid = req.session.admin_id;
        const admin_id = sid || qid;
        if (!admin_id || !Number(admin_id)) {
            res.send({
                status: 0,
                type: 'ERROR_ADMIN',
                message: 'admin_id参数错误'
            })
            return
        }

        try {
            const image_path = await this.getPath(req);
            await AdminModel.findOneAndUpdate({ id: admin_id }, { $set: { avatar: image_path } });
            res.send({
                status: 1,
                image_path
            })
            return
        } catch (err) {
            res.send({
                status: 0,
                type: 'ERROR_UPLOAD_IMG',
                message: '上传图片失败'
            })
            return
        }
    }


    //获取部分特定管理员展示到客户端
    async conditionGetAdmin(req, res, next) {
        const { user_name = '', city = '', creat_time = '', limit = 20, offset = 0 } = req.query;
        try {
            let query = {};
            if (user_name !== '') {
                query.user_name = user_name;
            }
            if (creat_time !== '') {
                query.creat_time = { $regex: new RegExp(`${creat_time}`, 'i') };
            }
            if (city !== '') {
                query.city = { $regex: `^${city}` };
            }
            const users = await AdminModel.find(query, { _id: 0, __v: 0, password: 0 });
            if (users.length !== 0) {
                res.send({
                    status: 1,
                    user: users,
                })
            } else {
                let message = '';
                if (user_name !== '' && creat_time !== '' && city !== '') {
                    message = '这段时间,这段地区,查无此人';
                } else if (user_name === '' && creat_time !== '' && city === '') {
                    message = '这段时间查无此人';
                } else if (user_name === '' && creat_time === '' && city !== '') {
                    message = '这段地区查无此人';
                } else {
                    message = '查无此人';
                }

                res.send({
                    status: 0,
                    message: message,
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

}

module.exports = new AdminAxios();