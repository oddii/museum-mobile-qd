import config from './config.js'
import store from 'store/index.js'

const service = {
	sendRequest(options) {
		options.headers = {
			Authorization: store.getters.getToken || uni.getStorageSync('token')
			// Authorization:'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2wiOiLotoXnuqfnrqHnkIblkZgiLCJpc3MiOiJBSmluR28iLCJpYXQiOjE1OTMzMTcyMzcsInN1YiI6InJvb3QiLCJleHAiOjE1OTM1NzY0Mzd9.GR3Vddxs5NqxLpy-z2ZuHrMKtVp-6kj7PoWQoqxrJfQ'
		}

		if (options.ctxType === 'formdata') Object.assign(options.headers, config.ctxFormDataHeader)
		else Object.assign(options.headers, config.ctxJsonHeader)

		return new Promise((resolve, reject) => {
			uni.request({
				url: config.baseUrl + options.url,
				data: options.data || {},
				method: options.method || 'GET',
				header: options.headers,
				success: (result) => {
					resolve(result)
				},
				fail: (error) => {
					reject(error)
				}
			})
		})
	}
}

export default service
