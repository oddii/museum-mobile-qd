const USER_API_URL = {
	login: '/auth/login', //  登录
	getUserList: '/api/member', //  获取成员列表
	getAllUserList: '/api/member/all', //  获取全部成员列表
	getUserListByIndex: '/api/member/index', //	获取成员索引列表
	getUserInfoById: '/api/member/id', // 根据 id 获得成员信息
	insertUser: '/api/member', //  创建成员
	updateUserById: '/api/member/id', // 根据 id 修改成员信息
	updatePasswordById: '/api/member/id/basic-password', //  普通用户根据 id 修改密码
	updatePasswordWithAdminById: '/api/member/id/admin-password', //  管理员根据 id 修改密码
	deleteUserById: '/api/member/id', //  根据 id 删除成员
	updateUserRoleById: '/api/member/id/role/roleId', //  修改成员角色
	sendEmailCode: '/api/member/email',
	forgetPassword: '/api/member/email-password'
}

export default USER_API_URL
