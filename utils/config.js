const config = {
	// baseUrl: 'http://192.168.196.71:8081',
	baseUrl: 'http://106.13.192.206:8081',
	// baseUrl: 'http://localhost:8081',
	ctxJsonHeader: {
		'Content-Type': 'application/json;charset=UTF-8'
	},
	ctxFormDataHeader: {
		'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
	},
	emailReg:/^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/,
	// smallImgPath: 'http://192.168.196.71/images/small/{imgName}.jpg',
	// bigImgPath: 'http://192.168.196.71/images/big/{imgName}.jpg'
	smallImgPath: 'http://test2.xkspbz.com/images/small/{imgName}.jpg',
	bigImgPath: 'http://test2.xkspbz.com/images/big/{imgName}.jpg'
}

export default config
