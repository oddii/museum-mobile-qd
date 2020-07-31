<template>
	<view class="user-wrapper">
		<!-- 导航栏 -->
		<uni-nav-bar
			left-icon="back"
			left-text="返回"
			:right-text="isCanInsertUser ? '新建' : ''"
			title="成员列表"
			:status-bar="true"
			:fixed="true"
			@clickLeft="handleGoBack"
			@clickRight="handleCreateModalShow"
		/>

		<u-index-list :scrollTop="scrollTop">
			<view class="item-wrapper" v-for="item in listData" :key="item.index">
				<u-index-anchor :index="item.index" />
				<tui-swipe-action :actions="optionList" @click="handleSwipeActionClick" v-for="(children, index) in item.children" :key="children.id" :params="children">
					<template v-slot:content>
						<view class="item-container">
							<view class="item-left"><image src="../../static/image/avatar.png" /></view>
							<view class="item-right">
								<view class="item-top">
									<view class="item-name">{{ children.name }}</view>
									<view class="item-role">{{ children.roleName }}</view>
								</view>
								<view class="item-bottom">
									<view class="item-name">{{ children.username }}</view>
									<view class="item-role">{{ children.email }}</view>
								</view>
							</view>
						</view>
					</template>
				</tui-swipe-action>
			</view>
		</u-index-list>

		<u-modal
			ref="createModal"
			v-model="createInfo.visible"
			:content-slot="true"
			:async-close="true"
			:show-cancel-button="true"
			title="新建成员"
			@cancel="handleCreateModalCancel"
			@confirm="handleCreateModalConfirm"
		>
			<view class="slot-content">
				<view class="modal-wrapper">
					<u-cell-group :border="false">
						<u-field v-model="createInfo.username" label="用户名" placeholder="请输入用户名(登录用)"></u-field>
						<u-field v-model="createInfo.name" label="姓名" placeholder="请输入姓名"></u-field>
						<u-field v-model="createInfo.email" label="绑定邮箱" placeholder="请输入绑定邮箱"></u-field>
						<u-field v-model="createInfo.password" type="password" label="密码" placeholder="请输入密码"></u-field>
						<u-field v-model="createInfo.confirmPassword" type="password" label="确认密码" placeholder="请输入确认密码"></u-field>
					</u-cell-group>
				</view>
			</view>
		</u-modal>

		<u-modal
			ref="userModal"
			v-model="userInfo.visible"
			:content-slot="true"
			:show-cancel-button="isCanEditPassword"
			:show-confirm-button="isCanEditName"
			title="成员详情"
			@cancel="handleUserModalCancel"
			@confirm="handleUserModelConfirm"
			confirm-text="修改姓名"
			cancel-text="修改密码"
			:mask-close-able="true"
		>
			<view class="slot-content">
				<view class="modal-wrapper">
					<view class="modal-item">编号：{{ userInfo.id }}</view>
					<view class="modal-item">用户名：{{ userInfo.username }}</view>
					<view class="modal-item">姓名：{{ userInfo.name }}</view>
					<view class="modal-item">绑定邮箱：{{ userInfo.email }}</view>
					<view class="modal-item">角色：{{ userInfo.roleName }}</view>
					
					<u-button style="margin: 10rpx;margin-bottom: 0;"
					 v-if="this.roleList.includes(5107)"
					 @click="handleEditEmailShow">修改邮箱</u-button>
				</view>
			</view>
		</u-modal>

		<u-modal
			ref="userEditPwdModal"
			v-model="editInfo.pwdModalVisible"
			:content-slot="true"
			:async-close="true"
			:show-cancel-button="true"
			:title="`正在修改 ${userInfo.name} 的密码`"
			@cancel="handleUserEditPwdModalCancel"
			@confirm="handleUserEditPwdModalConfirm"
			:mask-close-able="true"
		>
			<view class="slot-content">
				<view class="modal-wrapper">
					<u-cell-group :border="false">
						<u-field v-model="editInfo.password" type="password" label="密码" placeholder="请输入密码"></u-field>
						<u-field v-model="editInfo.confirmPassword" type="password" label="确认密码" placeholder="请输入确认密码"></u-field>
					</u-cell-group>
				</view>
			</view>
		</u-modal>

		<u-modal
			ref="userEditNameModal"
			v-model="editInfo.nameModalVisible"
			:content-slot="true"
			:async-close="true"
			:show-cancel-button="true"
			:title="`正在修改 ${userInfo.name} 的姓名`"
			@cancel="handleUserEditNameModalCancel"
			@confirm="handleUserEditNameModalConfirm"
			:mask-close-able="true"
		>
			<view class="slot-content">
				<view class="modal-wrapper">
					<u-cell-group :border="false"><u-field v-model="editInfo.name" label="姓名" placeholder="请输入姓名"></u-field></u-cell-group>
				</view>
			</view>
		</u-modal>
		
		<u-modal
			ref="userEditEmailModal"
			v-model="editInfo.emailModalVisible"
			:content-slot="true"
			:async-close="true"
			:show-cancel-button="true"
			:title="`正在修改 ${userInfo.name} 的绑定邮箱`"
			@cancel="handleUserEditEmailModalCancel"
			@confirm="handleUserEditEmailModalConfirm"
			:mask-close-able="true"
		>
			<view class="slot-content">
				<view class="modal-wrapper">
					<u-cell-group :border="false"><u-field v-model="editInfo.email" label="邮箱" placeholder="请输入邮箱"></u-field></u-cell-group>
				</view>
			</view>
		</u-modal>

		<u-picker v-model="assignInfo.visible" mode="selector" :range="assignInfo.list" range-key="name" @confirm="handleAssignModalConfrim" />

		<tui-toast ref="listUserToast"></tui-toast>
	</view>
</template>

<script>
import apiMethods from '../../utils/apiMethods.js';
import USER_API_URL from '../../api/userApi.js';
import ROLE_API_URL from '../../api/roleApi.js';
import config from '../../utils/config.js'
export default {
	onLoad() {
		this.getUserList();
	},
	onShow() {
		this.roleList = uni.getStorageSync('userInfo').roleList || this.$store.getters.getUserInfo.roleList
		this.getOptionListByRole();
	},
	data() {
		return {
			roleList: [],
			userInfo: {
				visible: false
			},
			assignInfo: {
				visible: false,
				list: []
			},
			createInfo: {
				visible: false,
				name: '',
				email:'',
				username: '',
				password: '',
				confirmPassword: ''
			},
			editInfo: {
				pwdModalVisible: false,
				nameModalVisible: false,
				emailModalVisible:false,
				name: '',
				email:'',
				password: '',
				confirmPassword: ''
			},
			scrollTop: 0,
			optionList: [],
			listData: []
		};
	},
	methods: {
		getUserList(params = {}) {
			/**
			 * 获取索引用户列表
			 */
			uni.showLoading({
				title: '正在加载'
			});
			apiMethods
				.getObject(USER_API_URL.getUserListByIndex, params)
				.then(result => {
					const { statusCode, data } = result;
					uni.hideLoading();
					if (statusCode !== 200) {
						return this.$refs.listUserToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '获取用户列表失败，请稍后重试',
							duration: 2000
						});
					}

					this.listData = data;
					uni.hideLoading();
				})
				.catch(error => {
					this.$refs.listUserToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		getRoleList() {
			/**
			 * 获得角色列表
			 */
			uni.showLoading({
				title: '正在加载'
			});
			apiMethods
				.getObject(ROLE_API_URL.getRoleList)
				.then(result => {
					const { statusCode, data } = result;
					uni.hideLoading();
					if (statusCode !== 200) {
						return this.$refs.listUserToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '获取角色列表失败，请稍后重试',
							duration: 2000
						});
					}

					console.log(data);
					this.assignInfo.list = data;
					uni.hideLoading();
				})
				.catch(error => {
					setTimeout(() => {
						this.$refs.userEditNameModal.clearLoading();
					}, 2000);

					this.$refs.listUserToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		getOptionListByRole() {
			/**
			 * 根据当前用户决定滚动操作列表
			 */
			this.optionList = []
			//	是否拥有 记录（5105）的权限
			if (this.roleList.includes(5105)) {
				this.optionList.push(			{
				name: '记录',
				color: '#fff',
				fontsize: 30, //单位rpx
				width: 70, //单位px
				background: '#bbb'
			});
			}
			
			//	是否拥有 修改姓名（5102）、修改密码（5103）的权限
			if (this.roleList.includes(5102) || this.roleList.includes(5103) || this.roleList.includes(5107)) {
				this.optionList.push({
					name: '操作',
					width: 70,
					fontsize: 30,
					color: '#fff',
					background: '#5677fc'
				});
			}

			//	是否拥有 分配角色（5104）的权限
			if (this.roleList.includes(5104)) {
				this.optionList.push({
					name: '分配角色',
					color: '#fff',
					fontsize: 30, //单位rpx
					width: 90, //单位px
					background: 'rgba(231, 165, 66, 0.8)'
				});
			}
		
		},
		handleSwipeActionClick({ index, item }) {
			/**
			 * 滑动菜单点击事件
			 */
			if (index === 0) {
				uni.navigateTo({
					url: `../details/record?title=成员&options=${JSON.stringify(item.options)}`
				});
			} else if (index === 1) {
				Object.assign(this.userInfo, item);
				this.handleUserModalShow();
			} else if (index === 2) {
				Object.assign(this.assignInfo, item);
				this.handleAssignModalShow();
			}
		},
		handleAssignModalShow() {
			/**
			 * 打开分配角色模态框
			 */
			this.getRoleList();
			this.assignInfo.visible = true;
		},
		handleAssignModalConfrim(res) {
			/**
			 * 分配橘色
			 */
			apiMethods
				.putObjectById(USER_API_URL.updateUserRoleById.replace(/roleId/, this.assignInfo.list[res].id), this.assignInfo.id)
				.then(result => {
					const { statusCode, data } = result;
					if (statusCode !== 200) {
						return this.$refs.listUserToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '分配失败，请稍后重试',
							duration: 2000
						});
					}

					return this.$refs.listUserToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/check.png',
						title: '分配成功',
						duration: 2000
					});
				})
				.catch(error => {
					setTimeout(() => {
						this.$refs.userEditNameModal.clearLoading();
					}, 2000);

					this.$refs.listUserToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		handleCreateModalShow() {
			/**
			 * 打开新建成员模态框
			 */
			this.createInfo.visible = true;
		},
		handleCreateModalCancel() {
			/**
			 * 关闭新建成员模态框
			 */
			this.createInfo.visible = false;
			this.createInfo.username = '';
			this.createInfo.name = '';
			this.createInfo.email = '';
			this.createInfo.password = '';
			this.createInfo.confirmPassword = '';
		},
		checkIsEmail(email){
			const pattern = config.emailReg
			if(pattern.test(email)){
				return true
			}else{
				return false
			}
		},
		handleCreateModalConfirm() {
			/**
			 * 新建成员
			 */
			const username = this.createInfo.username.trim();
			const name = this.createInfo.name.trim();
			const email = this.createInfo.email.trim();
			const password = this.createInfo.password.trim();
			const confirmPassword = this.createInfo.confirmPassword.trim();
			if (username === '') {
				setTimeout(() => {
					this.$refs.createModal.clearLoading();
				}, 2000);

				return this.$refs.listUserToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入用户名',
					duration: 2000
				});
			}

			if (name === '') {
				setTimeout(() => {
					this.$refs.createModal.clearLoading();
				}, 2000);

				return this.$refs.listUserToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入姓名',
					duration: 2000
				});
			}

			if (password === '') {
				setTimeout(() => {
					this.$refs.createModal.clearLoading();
				}, 2000);

				return this.$refs.listUserToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入密码',
					duration: 2000
				});
			}
			
			if (email === '') {
				setTimeout(() => {
					this.$refs.createModal.clearLoading();
				}, 2000);
			
				return this.$refs.listUserToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入绑定邮箱',
					duration: 2000
				});
			}
			
			if(!this.checkIsEmail(email)){
				setTimeout(() => {
					this.$refs.createModal.clearLoading();
				}, 2000);
				
				return this.$refs.fgIndexToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/info.png',
						title: '请先填写合法的邮箱地址',
						duration: 2000
					});
			} 

			if (confirmPassword === '') {
				setTimeout(() => {
					this.$refs.createModal.clearLoading();
				}, 2000);

				return this.$refs.listUserToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入确认密码',
					duration: 2000
				});
			}

			if (confirmPassword !== password) {
				setTimeout(() => {
					this.$refs.createModal.clearLoading();
				}, 2000);

				return this.$refs.listUserToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/fail.png',
					title: '两次输入的密码不一致，请重试',
					duration: 2000
				});
			}

			apiMethods
				.postObject(USER_API_URL.insertUser, {
					username,
					name,
					email,
					password
				})
				.then(result => {
					const { statusCode,data } = result;
					if (statusCode !== 201) {
						setTimeout(() => {
							this.$refs.createModal.clearLoading();
						}, 2000);

						return this.$refs.listUserToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: data.error,
							duration: 2000
						});
					}

					this.$refs.listUserToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/check.png',
						title: '新建成功',
						duration: 2000
					});
					this.getUserList();
					this.handleCreateModalCancel();
				})
				.catch(error => {
					setTimeout(() => {
						this.$refs.createModal.clearLoading();
					}, 2000);

					this.$refs.listUserToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		handleUserModalShow() {
			/**
			 * 打开成员详情模态框
			 */

			this.userInfo.visible = true;
		},
		handleUserModalCancel() {
			/**
			 * 打开修改密码模态框
			 */

			this.userInfo.visible = false;
			this.editInfo.pwdModalVisible = true;
			this.editInfo.nameModalVisible = false;
		},
		handleEditEmailShow() {
			/**
			 * 打开修改邮箱模态框
			 */
		
			this.userInfo.visible = false;
			this.editInfo.pwdModalVisible = false;
			this.editInfo.nameModalVisible = false;
			this.editInfo.emailModalVisible = true;
		},
		handleUserModelConfirm() {
			/**
			 * 打开修改姓名模态框
			 */

			this.userInfo.visible = false;
			this.editInfo.pwdModalVisible = false;
			this.editInfo.nameModalVisible = true;
		},
		handleUserEditPwdModalCancel() {
			/**
			 * 关闭修改密码模态框
			 */
			this.editInfo.pwdModalVisible = false;
			this.editInfo.newPassword = ''
			this.editInfo.oldPassword = ''
		},
		handleUserEditPwdModalConfirm() {
			/**
			 * 修改密码
			 */
			const password = this.editInfo.password.trim();
			const confirmPassword = this.editInfo.confirmPassword.trim();

			if (password === '') {
				setTimeout(() => {
					this.$refs.userEditPwdModal.clearLoading();
				}, 2000);

				return this.$refs.listUserToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入密码',
					duration: 2000
				});
			}

			if (confirmPassword === '') {
				setTimeout(() => {
					this.$refs.userEditPwdModal.clearLoading();
				}, 2000);

				return this.$refs.listUserToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入确认密码',
					duration: 2000
				});
			}

			if (confirmPassword !== password) {
				setTimeout(() => {
					this.$refs.userEditPwdModal.clearLoading();
				}, 2000);

				return this.$refs.listUserToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/fail.png',
					title: '两次输入的密码不一致，请重试',
					duration: 2000
				});
			}

			apiMethods
				.putObjectById(USER_API_URL.updatePasswordWithAdminById, this.userInfo.id, {
					password
				})
				.then(result => {
					const { statusCode } = result;
					if (statusCode !== 200) {
						setTimeout(() => {
							this.$refs.userEditPwdModal.clearLoading();
						}, 2000);

						return this.$refs.listUserToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '修改失败，请稍后重试',
							duration: 2000
						});
					}

					this.$refs.listUserToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/check.png',
						title: '修改成功',
						duration: 2000
					});
					this.handleUserEditPwdModalCancel();
				})
				.catch(error => {
					setTimeout(() => {
						this.$refs.userEditPwdModal.clearLoading();
					}, 2000);

					this.$refs.listUserToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		handleUserEditNameModalCancel() {
			/**
			 * 关闭修改姓名模态框
			 */
			this.editInfo.nameModalVisible = false;
			this.editInfo.name = ''
		},
		handleUserEditNameModalConfirm() {
			/**
			 * 修改姓名
			 */

			const name = this.editInfo.name.trim();
			const username = this.userInfo.username;
			const email = this.userInfo.email
			if (name === '') {
				setTimeout(() => {
					this.$refs.userEditNameModal.clearLoading();
				}, 2000);

				return this.$refs.listUserToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入姓名',
					duration: 2000
				});
			}

			apiMethods
				.putObjectById(USER_API_URL.updateUserById, this.userInfo.id, {
					name,
					username,
					email
				})
				.then(result => {
					const { statusCode } = result;
					if (statusCode !== 200) {
						setTimeout(() => {
							this.$refs.userEditNameModal.clearLoading();
						}, 2000);

						return this.$refs.listUserToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '修改失败，请稍后重试',
							duration: 2000
						});
					}

					this.$refs.listUserToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/check.png',
						title: '修改成功',
						duration: 2000
					});
					this.getUserList();
					this.handleUserEditNameModalCancel();
				})
				.catch(error => {
					setTimeout(() => {
						this.$refs.userEditNameModal.clearLoading();
					}, 2000);

					this.$refs.listUserToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		handleUserEditEmailModalCancel(){
			/**
			 * 取消修改邮箱
			 */
			this.editInfo.emailModalVisible = false;
			this.editInfo.email = ''
		},
		handleUserEditEmailModalConfirm(){
			/**
			 * 确认修改邮箱
			 */
			const username = this.userInfo.username;
			const name = this.userInfo.name;
			const email = this.editInfo.email.trim()
			if (email === '') {
				setTimeout(() => {
					this.$refs.userEditEmailModal.clearLoading();
				}, 2000);
			
				return this.$refs.listUserToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入绑定邮箱',
					duration: 2000
				});
			}
			
			if (!this.checkIsEmail(email)) {
				setTimeout(() => {
					this.$refs.userEditEmailModal.clearLoading();
				}, 2000);
			
				return this.$refs.listUserToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入合法的邮箱地址',
					duration: 2000
				});
			}
			
			apiMethods.putObjectById(USER_API_URL.updateUserById,this.userInfo.id, {
				username,
				name,
				email
			})
			.then(result => {
				const { statusCode } = result;
				if (statusCode !== 200) {
					setTimeout(() => {
						this.$refs.userEditEmailModal.clearLoading();
					}, 2000);
			
					return this.$refs.listUserToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: '修改失败，请稍后重试',
						duration: 2000
					});
				}
			
				this.$refs.listUserToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/check.png',
					title: '修改成功',
					duration: 2000
				});
				this.getUserList();
				this.handleUserEditEmailModalCancel();
			})
			.catch(error => {
				setTimeout(() => {
					this.$refs.userEditEmailModal.clearLoading();
				}, 2000);
			
				this.$refs.listUserToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/fail.png',
					title: error.response,
					duration: 2000
				});
			});
		},
		handleGoBack() {
			/**
			 * 返回首页
			 */
			uni.switchTab({ url: '/pages/list/index' });
		}
	},
	onPageScroll(e) {
		this.scrollTop = e.scrollTop;
	},
	computed: {
		isCanInsertUser() {
			/**
			 * 判断是否拥有 新增用户（5101） 的权限
			 */
			return !!this.roleList.includes(5101);
		},
		isCanEditName() {
			/**
			 * 判断是否拥有 修改姓名（5102） 的权限
			 */
			return !!this.roleList.includes(5102);
		},
		isCanEditPassword() {
			/**
			 * 判断是否拥有 新增用户（5103） 的权限
			 */
			return !!this.roleList.includes(5103);
		},
		isCanAssignRole() {
			/**
			 * 判断是否拥有 分配权限（5104） 的权限
			 */
			return !!this.roleList.includes(5104);
		}
	}
};
</script>

<style lang="scss">
.user-wrapper {
	.item-wrapper {
		.item-container {
			display: flex;
			padding: 16rpx;
			border-bottom: 1rpx solid #eee;

			.item-left {
				width: 100rpx;
				height: 100rpx;

				image {
					width: 100%;
					height: 100%;
				}
			}

			.item-right {
				display: flex;
				flex-direction: column;
				justify-content: space-between;
				margin: 2rpx 50rpx 0 10rpx;
				flex: 1;
				.item-top,
				.item-bottom{
					display: flex;
					align-items: center;
					justify-content: space-between;

					.item-name {
						font-size: $uni-font-size-lg;
					}

					.item-role {
						font-size: 24rpx;
						color: $secondary_font_color;
					}
				}
				.item-bottom {
					color: $secondary_font_color;
				}
			}
		}
	}

	.modal-wrapper {
		padding: $uni-font-size-lg;

		.modal-item {
			font-size: $default_font_size;
			padding: 6rpx 0;
		}
	}
}
</style>
