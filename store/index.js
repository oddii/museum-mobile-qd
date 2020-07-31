import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
const store = new Vuex.Store({
	state: {
		userInfo: {
			id: '',
			name: '',
			roleName: '',
			roleList: ''
		},
		token: '',
	},
	mutations: {
		setUserInfo: (state, value) => {
			state.userInfo = value
		},
		setToken: (state, value) => {
			state.token = value
		}
	},
	getters: {
		getUserInfo: state => state.userInfo,
		getToken: state => state.token
	},
	actions: {}
})
export default store
