<template>
	<view class="login-wrapper">
		<view class="login-title">登录</view>
		<view class="login-form">
			<view class="login-input">
				<view class="input-item">
					<i class="iconfont">&#xe8c8;</i>
					<input type="text" v-model="username" placeholder="请输入用户名" @input="handleInputChange" />
					<text class="iconfont" v-if="btnClearUsernameActive" @click="handleClearInput('username')">&#xe8e7;</text>
				</view>
				<view class="input-item">
					<i class="iconfont">&#xe8d5;</i>
					<input type="password" v-model="password" placeholder="请输入密码" @input="handleInputChange" />
					<text class="iconfont" v-if="btnClearPasswordActive" @click="handleClearInput('password')">&#xe8e7;</text>
				</view>
			</view>
			<view class="login-text" hover-class="login-text-hover"><navigator url="../forgetPassword/forgetPassword">忘记密码？</navigator></view>
		</view>
		<view class="btn-wrapper"><button :class="['btn-login', btnLoginActive ? 'btn-login-active' : '']" @click="login" :disabled="!btnLoginActive">登录</button></view>

		<tui-toast ref="loginIndexToast"></tui-toast>
	</view>
</template>

<script>
import apiMethods from '../../utils/apiMethods.js';
import USER_API_URL from '../../api/userApi.js';
export default {
	data() {
		return {
			username: '',
			password: '',
			btnLoginActive: false,
			btnClearUsernameActive: false,
			btnClearPasswordActive: false
		};
	},
	methods: {
		handleInputChange() {
			/**
			 * 监听输入框是否有输入
			 */
			this.username && this.password ? (this.btnLoginActive = true) : (this.btnLoginActive = false);
			this.username ? (this.btnClearUsernameActive = true) : (this.btnClearUsernameActive = false);
			this.password ? (this.btnClearPasswordActive = true) : (this.btnClearPasswordActive = false);
		},
		handleClearInput(value) {
			/**
			 * 情况所在输入框
			 */
			this[value] = '';
			this.handleInputChange();
		},
		login() {
			/**
			 * 登录
			 */
			uni.showLoading({
				title: '正在登录'
			});
			const username = this.username.trim();
			const password = this.password.trim();

			if (!username)
				return this.$refs.loginIndexToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入用户名',
					duration: 2000
				});
			else if (!password)
				return this.$refs.loginIndexToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入密码',
					duration: 2000
				});

			apiMethods
				.postObject(USER_API_URL.login, {
					username,
					password
				})
				.then(result => {
					const { header, data, statusCode } = result;
					if (statusCode !== 200) {
						uni.hideLoading()
						return this.$refs.loginIndexToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: data.message,
							duration: 2000
						});
					}

					const permissions = data.role.permissions;
					const roleList = [];
					permissions.forEach(item => {
						roleList.push(item.code);
					});

					const userInfo = {
						id: data.id,
						name: data.name,
						roleName: data.role.name,
						roleList: roleList
					};

					uni.setStorage({
						key: 'token',
						data: header.Authorization,
						success: ressult => {
							this.$store.commit('setToken', header.Authorization);
						}
					});

					uni.setStorage({
						key: 'userInfo',
						data: userInfo,
						success: ressult => {
							this.$store.commit('setUserInfo', userInfo);
						}
					});
					uni.hideLoading();

					uni.switchTab({
						url: '../list/index'
					});
				})
				.catch(error => {
					uni.hideLoading();
					this.$refs.loginIndexToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		}
	}
};
</script>

<style lang="scss">
.login-wrapper {
	.login-title {
		width: 100%;
		margin-top: 136rpx;
		font-size: 48rpx;
		font-weight: 700;
		color: #333;
		line-height: 42rpx;
		padding: 40rpx;
	}

	.login-form {
		padding-top: 60rpx;

		.login-input {
			box-sizing: border-box;
			padding: 0 40rpx;

			.input-item {
				display: flex;
				align-items: center;
				background-color: transparent;
				font-size: $uni-font-size-base;
				color: rgb(51, 51, 51);
				padding: 42rpx 30rpx;
				border-bottom: 1rpx solid #f2f4f5;
				i {
					color: $secondary_font_color;
					font-size: 46rpx;
					margin-right: 20rpx;
				}
				input {
					width: 100%;
					font-size: $uni-font-size-lg;
				}

				text {
					height: 36rpx;
					width: 36rpx;
					margin-left: 16rpx;
					color: $default_font_color;
				}
			}
		}

		.login-text {
			padding: 40rpx;
			text-align: right;
		}

		.login-text-hover {
			color: $primary_color;
		}
	}

	.btn-wrapper {
		width: 100%;
		padding: 0 30rpx;
		box-sizing: border-box;
		margin-top: 80rpx;

		.btn-login {
			width: 100%;
			height: 96rpx;
			line-height: 96rpx;
			font-size: $uni-font-size-lg;
			border-radius: 50rpx;
			color: #919191;
			background-color: #f3f3f3;
			text-align: center;
		}

		.btn-login-active {
			background: $primary_color !important;
			color: #fff;
		}
	}
}
</style>
