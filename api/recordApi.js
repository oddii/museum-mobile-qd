const RECODE_API_URL = {
  getRecordList: '/api/option',
  getAllRecordList: '/api/option/all',
  getRecordListByFilter: '/api/option/filter', // 根据 操作类型、时间段 筛选操作记录
  insertRecordByType: '/api/option?optionNumber=type'
}

export default RECODE_API_URL