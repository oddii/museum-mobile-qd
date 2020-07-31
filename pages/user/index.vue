<template>
	<view class="user-wrapper">
		<uni-nav-bar :status-bar="true" :fixed="true" background-color="#5677fc" color="#fff" :shadow="false" />

		<view class="user-info-wrapper">
			<view class="image-wrapper"><image src="../../static/image/avatar.png"></image></view>
			<view class="info-wrapper">
				<view class="info-name">{{ userInfo.name }}</view>
				<view class="info-role">{{ userInfo.role }}</view>
			</view>
		</view>

		<view class="btn-wrapper">
			<view class="btn-item btn-primary" @click="handleEditPopupShow">
				<i class="iconfont">&#xe8b8;</i>
				<text>修改密码</text>
			</view>
			<view class="btn-item btn-danger" @click="handleLogoutShow">
				<i class="iconfont">&#xe8d8;</i>
				<text>退出登录</text>
			</view>
		</view>

		<view class="user-footer"></view>

		<!-- 修改密码弹出层 -->
		<u-modal
			ref="editPasswordModal"
			v-model="editInfo.visible"
			:content-slot="true"
			:show-cancel-button="true"
			title="修改密码"
			:mask-close-able="true"
			@confirm="handleEditSubmit"
			@cancel="handleEditCancel"
			:async-close="true"
		>
			<view class="slot-content">
				<view class="modal-wrapper">
					<u-cell-group :border="false">
						<u-field v-model="editInfo.oldPassword" label="原密码" placeholder="请输入原密码" :password="true"></u-field>
						<u-field v-model="editInfo.newPassword" label="新密码" placeholder="请输入新密码" :password="true"></u-field>
						<u-field v-model="editInfo.confirmPassword" label="确认密码" placeholder="请输入确认密码" :password="true"></u-field>
					</u-cell-group>
				</view>
			</view>
		</u-modal>
		
		<tui-actionsheet
			:show="logoutInfo.visible"
			:itemList="logoutInfo.list"
			:size="26"
			:tips="logoutInfo.tips.text"
			@click="logout"
			@cancel="handleLogoutCancel"
			:maskClosable="true"
		></tui-actionsheet>

		<tui-toast ref="userIndexToast"></tui-toast>
	</view>
</template>

<script>
import apiMethods from '../../utils/apiMethods.js';
import USER_API_URL from '../../api/userApi.js';
export default {
	onShow() {
		this.handleLogoutCancel();
		this.getUserInfo();
	},
	data() {
		return {
			userInfo: {
				name: '',
				role: ''
			},
			editInfo: {
				visible: false,
				oldPassword: '',
				newPassword: '',
				confirmPassword: ''
			},
			logoutInfo: {
				visible: false,
				tips: {
					text: '退出登录会清除您的登录信息，确认退出吗？',
					color: '#909399',
					fontSize: 26
				},
				list: [{ text: '退出登录', color: 'red', fontSize: 34 }]
			}
		};
	},
	methods: {
		getUserInfo() {
			/**
			 * 获得用户信息
			 */
			this.userInfo.name = uni.getStorageSync('userInfo').name || this.$store.getters.getUserInfo.name;
			this.userInfo.role = uni.getStorageSync('userInfo').roleName || this.$store.getters.getUserInfo.roleName;
		},
		handleEditPopupShow() {
			/**
			 * 展示修改密码弹出层
			 */
			this.editInfo.visible = true;
		},
		handleEditCancel() {
			/**
			 * 取消修改
			 */

			this.editInfo.oldPassword = '';
			this.editInfo.newPassword = '';
			this.editInfo.confirmPassword = '';
			this.editInfo.visible = false;
		},
		handleEditSubmit() {
			/**
			 * 提交修改
			 */
			if (this.editInfo.oldPassword.trim() === '') {
				setTimeout(() => {
					this.$refs.editPasswordModal.clearLoading();
				}, 2000);

				return this.$refs.userIndexToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入原密码',
					duration: 2000
				});
			}

			if (this.editInfo.newPassword.trim() === '') {
				setTimeout(() => {
					this.$refs.editPasswordModal.clearLoading();
				}, 2000);
				
				return this.$refs.userIndexToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入新密码',
					duration: 2000
				});
			}

			if (this.editInfo.confirmPassword.trim() === '') {
				setTimeout(() => {
					this.$refs.editPasswordModal.clearLoading();
				}, 2000);
				
				return this.$refs.userIndexToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入确认密码',
					duration: 2000
				});
			}

			if (this.editInfo.newPassword !== this.editInfo.confirmPassword) {
				setTimeout(() => {
					this.$refs.editPasswordModal.clearLoading();
				}, 2000);
				
				return this.$refs.userIndexToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/fail.png',
					title: '两次密码输入不一致，请重试',
					duration: 2000
				});
			}

			const userId = uni.getStorageSync('userInfo').id || this.$store.getters.getUserInfo.id;
			apiMethods
				.putObjectById(USER_API_URL.updatePasswordById, userId, {
					oldPassword: this.editInfo.oldPassword.trim(),
					newPassword: this.editInfo.newPassword.trim()
				})
				.then(result => {
					const { statusCode, data } = result;
					if (statusCode !== 200) {
						setTimeout(() => {
							this.$refs.editPasswordModal.clearLoading();
						}, 2000);
						
						return this.$refs.userIndexToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: data.message,
							duration: 2000
						});
					}

					setTimeout(() => {
						this.$refs.editPasswordModal.clearLoading();
					}, 2000);
					this.$refs.userIndexToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/check.png',
						title: '修改成功',
						duration: 2000
					});
					this.handleEditCancel();
				})
				.catch(error => {
					setTimeout(() => {
						this.$refs.editPasswordModal.clearLoading();
					}, 2000);
					this.$refs.userIndexToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		handleLogoutShow() {
			/**
			 * 弹出提示框
			 */
			this.logoutInfo.visible = true;
		},
		handleLogoutCancel() {
			this.logoutInfo.visible = false;
		},
		logout() {
			/**
			 * 退出登录
			 */
			this.handleLogoutCancel();
			uni.removeStorage({
				key: 'userInfo',
				success: () => {
					this.$store.commit('setUserInfo', {
						id: '',
						name: '',
						roleName:'',
						roleList: []
					});
				}
			});

			uni.removeStorage({
				key: 'setToken',
				success: () => {
					this.$store.commit('setToken', '');
				}
			});

			uni.navigateTo({
				url: '../login/index'
			});
		}
	},
	computed: {
		role() {
			return this.userInfo.role === 'BASIC' ? '普通用户' : '超级管理员';
		}
	}
};
</script>

<style lang="scss">
uni-page-body {
	height: 100%;
}

.user-wrapper {
	.uni-navbar--border {
		border-bottom: none !important;
	}

	.user-info-wrapper {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 440rpx;
		// background-color: #fafafa;
		background-image: url(../../static/image/bg.png);
		background-repeat: no-repeat;
		background-size: 100% 100%;
		.image-wrapper {
			height: 160rpx;
			width: 160rpx;

			image {
				width: 100%;
				height: 100%;
			}
		}

		.info-wrapper {
			text-align: center;
			.info-name {
				padding: 20rpx 0 10rpx;
				font-size: $lg_font_size;
				color: #fff;
			}

			.info-role {
				font-size: $uni-font-size-base;
				color: #eee;
			}
		}
	}

	.btn-wrapper {
		display: flex;
		height: 140rpx;
		margin: -30rpx 30rpx 26rpx 30rpx;
		border-radius: 20rpx;
		box-shadow: 1rpx 4rpx 14rpx 0 rgba(0, 0, 0, 0.1);
		z-index: 2;
		background-color: #fff;

		.btn-item {
			display: flex;
			align-items: center;
			flex: 1;
			padding: 40rpx;

			i {
				font-size: 66rpx;
			}

			text {
				margin-left: 20rpx;
				font-size: $default_font_size;
				color: $default_font_color;
			}
		}
	}

	.modal-wrapper {
		padding: $uni-font-size-lg;
	}

	.btn-primary {
		color: $primary_color;
	}

	.btn-danger {
		color: $danger_color;
	}
}
</style>
