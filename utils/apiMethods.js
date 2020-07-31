import service from './service.js'

const apiMethods = {
	getObject(url, params = {}) {
		return service.sendRequest({
			url,
			method: 'GET',
			data: params
		})
	},
	getObjectById(url, id) {
		return service.sendRequest({
			url: url.replace(/id/, id),
			method: 'GET',
			data: {}
		})
	},
	postObject(url, data = {}) {
		return service.sendRequest({
			url,
			method: 'POST',
			data
		})
	},
	putObjectById(url, id, data = {}) {
		return service.sendRequest({
			url: url.replace(/id/, id),
			method: 'PUT',
			data
		})
	},
	deleteObjectById(url, id) {
		return service.sendRequest({
			url: url.replace(/id/, id),
			method: 'DELETE'
		})
	}

}

export default apiMethods
