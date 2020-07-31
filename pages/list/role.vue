<template>
	<view class="role-wrapper">
		<!-- 导航栏 -->
		<uni-nav-bar
			left-icon="back"
			left-text="返回"
			:right-text="isCanInsertRole ? '新建' : ''"
			title="角色列表"
			:status-bar="true"
			:fixed="true"
			@clickLeft="handleGoBack"
			@clickRight="handleRoleCreateModalShow"
		/>

		<view class="list-wrapper">
			<tui-swipe-action :actions="optionList" @click="handleSwipeActionClick" v-for="item in listData" :key="item.id" :params="item">
				<template v-slot:content>
					<view class="item-container">
						<view class="item-left">
							<view class="item-name">{{ item.name }}</view>
							<view class="item-description">{{ item.description }}</view>
						</view>
					</view>
				</template>
			</tui-swipe-action>
		</view>

		<u-modal
			ref="roleEditModal"
			v-model="roleInfo.visible"
			:content-slot="true"
			:async-close="true"
			:show-cancel-button="true"
			:title="roleInfo.title"
			@cancel="handleRoleModalCancel"
			@confirm="handleRoleModalConfirm"
			:mask-close-able="true"
		>
			<view class="slot-content">
				<view class="modal-wrapper">
					<u-cell-group :border="false">
						<u-field v-model="roleInfo.name" label="角色名称" placeholder="请输入角色名称"></u-field>
						<u-field v-model="roleInfo.description" type="textarea" label="角色描述" placeholder="请输入角色描述"></u-field>
					</u-cell-group>
				</view>
			</view>
		</u-modal>

		<tui-toast ref="listRoleToast"></tui-toast>
	</view>
</template>

<script>
import api from '../../utils/apiMethods.js';
import ROLE_API_URL from '../../api/roleApi.js';
import PERMISSION_API_URL from '../../api/permissionApi.js';
export default {
	onLoad() {
		this.getRoleList();
	},
	onShow() {
		this.roleList = uni.getStorageSync('userInfo').roleList || this.$store.getters.getUserInfo.roleList
		this.getOptionListByRole();
	},
	data() {
		return {
			roleList: [],
			listData: [],
			roleInfo: {
				visible: false
			},
			optionList: []
		};
	},
	methods: {
		getRoleList() {
			/**
			 * 获取角色列表
			 */
			uni.showLoading({
				title: '正在加载'
			});
			api.getObject(ROLE_API_URL.getRoleList)
				.then(result => {
					const { data, statusCode } = result;
					if (statusCode !== 200)
						return this.$refs.listRoleToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '获取角色列表失败，请稍后重试',
							duration: 2000
						});

					this.listData = data;
					uni.hideLoading();
				})
				.catch(error => {
					this.$refs.listRoleToast.show({
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
			//	是否拥有 角色授权（3203）的权限
			if (this.roleList.includes(3203)) {
				this.optionList.push({
					name: '修改信息',
					color: '#fff',
					fontsize: 30, //单位rpx
					width: 90, //单位px
					background: '#bbb'
				});
			}

			//	是否拥有 分配权限（3204）的权限
			if (this.roleList.includes(3204)) {
				this.optionList.push({
					name: '分配权限',
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
				Object.assign(this.roleInfo, item);
				this.handleRoleEditModalShow();
			} else if (index === 1) {
				uni.navigateTo({
					url: `../details/assignPermission?id=${item.id}`
				});
			}
		},
		handleRoleEditModalShow() {
			/**
			 * 打开角色模态框（编辑角色）
			 */
			this.roleInfo.title = `正在编辑 ${this.roleInfo.name} 的信息`;
			this.roleInfo.visible = true;
			this.roleInfo.type = 'edit';
		},
		handleRoleCreateModalShow() {
			/**
			 * 打开角色模态框（创建角色）
			 */
			this.roleInfo.title = `新建角色`;
			this.roleInfo.visible = true;
			this.roleInfo.type = 'create';
		},
		handleRoleModalCancel() {
			/**
			 * 关闭角色模态框
			 */
			this.roleInfo.visible = false;
			this.roleInfo.name = '';
			this.roleInfo.description = '';
			this.roleInfo.type = '';
		},
		handleRoleModalConfirm() {
			/**
			 * 角色模态框确定事件
			 */
			const name = this.roleInfo.name;
			const description = this.roleInfo.description;
			if (!name) {
				setTimeout(() => {
					this.$refs.roleEditModal.clearLoading();
				}, 2000);

				return this.$refs.listRoleToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入角色名称',
					duration: 2000
				});
			}

			if (!description) {
				setTimeout(() => {
					this.$refs.roleEditModal.clearLoading();
				}, 2000);

				return this.$refs.listRoleToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入角色描述',
					duration: 2000
				});
			}

			if (this.roleInfo.type === 'edit') {
				api.putObjectById(ROLE_API_URL.updateRoleById, this.roleInfo.id, {
					name: name.trim(),
					description: description.trim()
				})
					.then(result => {
						const { statusCode } = result;
						if (statusCode !== 200) {
							setTimeout(() => {
								this.$refs.roleEditModal.clearLoading();
							}, 2000);

							return this.$refs.listRoleToast.show({
								icon: true,
								imgUrl: '../../static/image/toast/fail.png',
								title: '修改失败，请稍后重试',
								duration: 2000
							});
						}

						this.$refs.listRoleToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/check.png',
							title: '修改成功',
							duration: 2000
						});
						this.getRoleList();
						this.handleRoleModalCancel();
					})
					.catch(error => {
						setTimeout(() => {
							this.$refs.roleEditModal.clearLoading();
						}, 2000);

						this.$refs.listRoleToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: error.response,
							duration: 2000
						});
					});
			} else if (this.roleInfo.type === 'create') {
				api.postObject(ROLE_API_URL.insertRole, {
					name: name.trim(),
					description: description.trim()
				})
					.then(result => {
						const { statusCode } = result;
						if (statusCode !== 200) {
							setTimeout(() => {
								this.$refs.roleEditModal.clearLoading();
							}, 2000);

							return this.$refs.listRoleToast.show({
								icon: true,
								imgUrl: '../../static/image/toast/fail.png',
								title: '新建失败，请稍后重试',
								duration: 2000
							});
						}

						this.$refs.listRoleToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/check.png',
							title: '新建成功',
							duration: 2000
						});
						this.getRoleList();
						this.handleRoleModalCancel();
					})
					.catch(error => {
						setTimeout(() => {
							this.$refs.roleEditModal.clearLoading();
						}, 2000);

						this.$refs.listRoleToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: error.response,
							duration: 2000
						});
					});
			}
		},
		handleGoBack() {
			/**
			 * 返回首页
			 */
			uni.switchTab({ url: '/pages/list/index' });
		}
	},
	computed:{
		isCanInsertRole(){
			/**
			 * 判断是否拥有 新增角色（3201） 的权限
			 */
			return !!this.roleList.includes(3201);
		}
	}
};
</script>

<style lang="scss">
.role-wrapper {
	.list-wrapper {
		.item-container {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 32rpx;
			padding-right: 16rpx;
			border-bottom: 1rpx solid #eee;
			.item-left {
				.item-name {
					font-size: $uni-font-size-lg;
					margin-bottom: 6rpx;
				}

				.item-description {
					width: 320rpx;
					color: $secondary_font_color;
					font-size: 20rpx;
					letter-spacing: 0;
					overflow: hidden;
					display: -webkit-box;
					text-overflow: ellipsis;
					-webkit-line-clamp: 2; /*要显示的行数*/
					-webkit-box-orient: vertical;
					font-size: 12px;
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
