<template>
	<view class="fg-wrapper">
		<view class="top-wrapper">
			<view class="fg-back" @click="handleGoBack"><text class="iconfont">&#xe8ef;</text></view>
		</view>

		<view class="login-title">忘记密码</view>
		<view class="login-form">
			<view class="login-input">
				<view class="input-item">
					<i class="iconfont">&#xe8c8;</i>
					<input type="text" v-model="username" placeholder="请输入用户名" @input="handleInputChange" />
					<text class="iconfont" v-if="btnClearUsernameActive" @click="handleClearInput('username')">&#xe8e7;</text>
				</view>
				<view class="input-item">
					<i class="iconfont">&#xe8c0;</i>
					<input type="text" v-model="email" placeholder="请输入绑定邮箱" @input="handleInputChange" />
					<text class="iconfont" v-if="btnClearEmailActive" @click="handleClearInput('email')">&#xe8e7;</text>
				</view>
				<view class="input-item">
					<i class="iconfont">&#xe902;</i>
					<input type="text" v-model="code" placeholder="请输入验证码" @input="handleInputChange" />
					<text class="iconfont" v-if="btnClearCodeActive" @click="handleClearInput('code')">&#xe8e7;</text>
					<u-button type="primary" size="medium" shape="circle" :disabled="isSending" @click="handleSendCode">{{ btnSendCodeText }}</u-button>
				</view>
				<view class="input-item">
					<i class="iconfont">&#xe8d5;</i>
					<input type="password" v-model="password" placeholder="请输入新密码" @input="handleInputChange" />
					<text class="iconfont" v-if="btnClearPasswordActive" @click="handleClearInput('password')">&#xe8e7;</text>
				</view>
				<view class="input-item">
					<i class="iconfont">&#xe8d5;</i>
					<input type="password" v-model="confirmPassword" placeholder="请输入确认密码" @input="handleInputChange" />
					<text class="iconfont" v-if="btnClearConfirmPasswordActive" @click="handleClearInput('confirmPassword')">&#xe8e7;</text>
				</view>
			</view>
		</view>
		<view class="btn-wrapper">
			<button :class="['btn-login', btnSubmitActive ? 'btn-login-active' : '']" @click="handleSubmit" :disabled="!btnSubmitActive">确认修改</button>
		</view>

		<tui-toast ref="fgIndexToast"></tui-toast>
	</view>
</template>

<script>
import config from '../../utils/config.js';
import apiMethods from '../../utils/apiMethods.js';
import USER_API_URL from '../../api/userApi.js';
export default {
	data() {
		return {
			username: '',
			email: '',
			code: '',
			password: '',
			confirmPassword: '',
			btnClearUsernameActive: false,
			btnClearEmailActive: false,
			btnClearCodeActive: false,
			btnClearPasswordActive: false,
			btnClearConfirmPasswordActive: false,
			btnSubmitActive: false,
			btnSendCodeText: '发送',
			isSending: false,
			btnSendCodeActive: false
		};
	},
	methods: {
		handleInputChange() {
			/**
			 * 监听输入框是否有输入
			 */
			this.email && this.code && this.password && this.username && this.confirmPassword ? (this.btnSubmitActive = true) : (this.btnSubmitActive = false);
			this.username ? (this.btnClearUsernameActive = true) : (this.btnClearUsernameActive = false);
			this.email ? (this.btnClearEmailActive = true) : (this.btnClearEmailActive = false);
			this.code ? (this.btnClearCodeActive = true) : (this.btnClearCodeActive = false);
			this.password ? (this.btnClearPasswordActive = true) : (this.btnClearPasswordActive = false);
			this.confirmPassword ? (this.btnClearConfirmPasswordActive = true) : (this.btnClearConfirmPasswordActive = false);
		},
		handleClearInput(value) {
			/**
			 * 情况所在输入框
			 */
			this[value] = '';
			this.handleInputChange();
		},
		checkIsEmail(email) {
			const pattern = config.emailReg;
			if (pattern.test(email)) {
				return true;
			} else {
				return false;
			}
		},
		handleSendCode() {
			/**
			 * 发送邮箱验证码
			 */

			const username = this.username.trim();
			const email = this.email.trim();
			if (email === '' && username === '')
				return this.$refs.fgIndexToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请先填写绑定邮箱与用户名',
					duration: 2000
				});

			if (!this.checkIsEmail(email))
				return this.$refs.fgIndexToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请先填写正确的邮箱格式',
					duration: 2000
				});

			if (this.isSending)
				return this.$refs.fgIndexToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请勿重复发送',
					duration: 2000
				});

			uni.showLoading({
				title: '正在发送中，请耐心等待...'
			});
			apiMethods
				.postObject(USER_API_URL.sendEmailCode, {
					username,
					email
				})
				.then(result => {
					const { statusCode,data } = result;
					uni.hideLoading();
					if (statusCode !== 200) {
						return this.$refs.fgIndexToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/info.png',
							title: data.message || '发送失败',
							duration: 2000
						});
					}
					
					this.$refs.fgIndexToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/check.png',
						title: '发送成功',
						duration: 2000
					});
					this.setEmailCodeTimer();
				})
				.catch(() => {
					uni.hideLoading();
					this.$refs.fgIndexToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: '服务器出现故障，请稍后重试',
						duration: 2000
					});
				});
		},
		setEmailCodeTimer() {
			/**
			 * 倒计时
			 */
			this.isSending = true;
			let count = 0;
			const timer = setInterval(() => {
				this.btnSendCodeText = ++count;
				if (count === 60) {
					this.btnSendCodeText = '发送';
					this.btnSendCodeActive = false;
					this.isSending = false;
					clearInterval(timer);
				}
			}, 1000);
		},
		handleSubmit() {
			/**
			 * 提交修改
			 */
			const username = this.username.trim();
			const email = this.email.trim();
			const code = this.code.trim();
			const password = this.password.trim();
			const confirmPassword = this.confirmPassword.trim();

			if (username === '')
				return this.$refs.loginIndexToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入用户名',
					duration: 2000
				});
				
			if (email === '')
				return this.$refs.loginIndexToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入绑定邮箱',
					duration: 2000
				});
			
			if (code === '')
				return this.$refs.loginIndexToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入验证码',
					duration: 2000
				});
			
			if (password === '')
				return this.$refs.loginIndexToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入新密码',
					duration: 2000
				});
				
			if (confirmPassword === '')
				return this.$refs.loginIndexToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入确认密码',
					duration: 2000
				});
				
			if (password === confirmPassword)
				return this.$refs.loginIndexToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '两次密码输入不一致，请重新输入',
					duration: 2000
				});
			
			uni.showLoading({title:'加载中'})
			apiMethods.postObject(USER_API_URL.forgetPassword,{
				username,
				password,
				email,
				code
			})
			.then(result=>{
				const {statusCode} = result
				if(statusCode!==200) return this.$refs.loginIndexToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/fail.png',
					title: '修改失败',
					duration: 2000
				});
				
				return this.$refs.loginIndexToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/check.png',
					title: '修改成功',
					duration: 2000
				});
			})
			.catch(error=>{
				if(error.response){
					return this.$refs.loginIndexToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response.data,
						duration: 2000
					});
				}
			})
			
		},
		handleGoBack() {
			/**
			 * 返回上一页
			 */
			uni.navigateTo({ url: '../login/index' });
		}
	}
};
</script>

<style lang="scss">
.fg-wrapper {
	.top-wrapper {
		.fg-back {
			padding: 24rpx;
			text {
				font-size: 50rpx;
			}
		}
	}

	.login-title {
		width: 100%;
		margin-top: 40rpx;
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
