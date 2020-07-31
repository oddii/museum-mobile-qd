const RELIC_API_URL = {
  getRelicList: '/api/relics', //  获取文物列表，可分页
  getRelicListByFilter: '/api/relics/filter', //  根据筛选条件获取文物列表
  getAllRelicList: '/api/relics/all', //  获取全部文物列表，不分页
  getRelicById: '/api/relics/id', //  根据 id  获取文物信息
  updateRelicById: '/api/relics/id', //  根据 id 修改文物信息
  uploadImageUrlsById: '/api/relics/id/image', //  根据 id 上传文物照片信息
  deleteImageUrlsById: '/api/relics/id/image', // 根据 id 删除文物照片信息
  getWaitRelicList: '/api/relics-request', //  获取待入库文物列表
  getWaitRelicById: '/api/relics-request/id', //  根据 id 获取待入库文物
  getAllWaitRelicList: '/api/relics-request/all', //  获取待入库文物的列表，不分页
  getWaitRelicListByFilter: '/api/relics-request/filter', //  根据条件获取待入库文物列表
  deleteWaitRelicById: '/api/relics-request/id' ,//  根据 id 删除文物信息,
  uploadWaitImage:'/api/relics-request'
}

export default RELIC_API_URL
