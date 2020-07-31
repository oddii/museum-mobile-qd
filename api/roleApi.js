const ROLE_API_URL = {
  getRoleList: '/api/role/all', // 获取角色列表
  getRoleById: '/api/role/id', //  获取角色详情
  insertRole: '/api/role', //  创建角色
  updateRoleById: '/api/role/id', //  根据id编辑角色
  updatePermissionById: '/api/role/id/permission' //  根据id编辑角色权限
}

export default ROLE_API_URL
