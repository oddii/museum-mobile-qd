<template>
	<view class="index-wrapper">
		<uni-nav-bar title="首页" :status-bar="true" :fixed="true" />

		<view class="index-title-wrapper">
			<view class="index-title-container">
				<image src="../../static/image/logo-big.png" />
				<view class="index-title">
					后台管理系统
					<text>移动端</text>
				</view>
			</view>
		</view>

		<view class="index-btn-wrapper">
			<view class="btn-item" @click="handleTakePhoto" v-if="isCanTakePhotos">
				<i class="iconfont btn-success">&#xe8d1;</i>
				<text>拍照录入</text>
			</view>
			<view class="btn-item" @click="handleScanCode" v-if="isCanEditRelicStates">
				<i class="iconfont btn-primary">&#xe8d4;</i>
				<text>查看详情</text>
			</view>
			<view class="btn-item" @click="handleQuestionModalShow">
				<i class="iconfont btn-danger">&#xe8bb;</i>
				<text>问题报障</text>
			</view>
		</view>

		<view class="index-list-wrapper">
			<view class="list-group" v-if="isCanManageRelic">
				<view class="list-title">文物管理</view>
				<navigator url="../list/relic" hover-class="navigator-hover" v-if="isCanUseRelicList">
					<view class="list-item">
						<i class="list-icon iconfont">&#xe886;</i>
						文物列表
					</view>
				</navigator>
				<navigator url="../list/wait" hover-class="navigator-hover" v-if="isCanUseWaitList">
					<view class="list-item">
						<i class="list-icon iconfont">&#xe887;</i>
						待录文物
					</view>
				</navigator>
			</view>
			<view class="list-group" v-if="isCanManageRecord">
				<view class="list-title">操作管理</view>
				<navigator url="../list/record" hover-class="navigator-hover" v-if="isCanUseRecordList">
					<view class="list-item">
						<i class="list-icon iconfont">&#xe898;</i>
						操作记录
					</view>
				</navigator>
			</view>
			<view class="list-group" v-if="isCanManageStore">
				<view class="list-title">仓库管理</view>
				<navigator url="../list/store" hover-class="navigator-hover" v-if="isCanUseStoreList">
					<view class="list-item">
						<i class="list-icon iconfont">&#xe88f;</i>
						仓库列表
					</view>
				</navigator>
			</view>
			<view class="list-group" v-if="isCanManagePermission">
				<view class="list-title">权限管理</view>
				<navigator url="../list/permission" hover-class="navigator-hover" v-if="isCanUsePermissionList">
					<view class="list-item">
						<i class="list-icon iconfont">&#xe8a2;</i>
						权限列表
					</view>
				</navigator>
				<navigator url="../list/role" hover-class="navigator-hover" v-if="isCanUseRoleList">
					<view class="list-item">
						<i class="list-icon iconfont">&#xe91b;</i>
						角色列表
					</view>
				</navigator>
			</view>
			<view class="list-group" v-if="isCanManageUser">
				<view class="list-title">成员管理</view>
				<navigator url="../list/user" hover-class="hover-class-radius" v-if="isCanUseUserList">
					<view class="list-item">
						<i class="list-icon iconfont">&#xe8c9;</i>
						成员列表
					</view>
				</navigator>
			</view>
		</view>

		<view class="index-more-wrapper" v-if="isCanEditRelicStates">
			<view class="more-title">扫码批量操作</view>
			<view class="more-group">
				<view class="group-item" v-for="item in moreOperationList" :key="item.icon" @click="handleDetermineOperation(item.operationCode)" :hover-class="item.hoverClass">
					<i class="iconfont">{{ item.icon }}</i>
					<text>{{ item.text }}</text>
				</view>
			</view>
		</view>

		<!-- 弹出层 -->
		<u-modal
			ref="listIndexOptModal"
			v-model="operationModal.visible"
			:content-slot="true"
			:show-cancel-button="true"
			:title="operationModal.title"
			:mask-close-able="true"
			:async-close="true"
			@cancel="handleoperationModalCancel"
			@confirm="handleoperationModalConfirm"
		>
			<view class="slot-content">
				<view class="modal-wrapper">
					<u-cell-group :border="false">
						<u-field v-model="operationModal.value" :label="operationModal.label" :placeholder="operationModal.title"></u-field>
					</u-cell-group>
				</view>
			</view>
		</u-modal>

		<!-- 弹出层 -->
		<u-modal v-model="questionInfo.visible" :content-slot="true" :show-confirm-button="false" title="请联系管理员或添加运维微信" :mask-close-able="true">
			<view class="slot-content">
				<view class="modal-wrapper"><image src="../../static/image/wxqrcode.png"></image></view>
			</view>
		</u-modal>

		<tui-toast ref="listIndexToast"></tui-toast>

		<!-- 仓库选择器 -->
		<w-picker
			mode="linkage"
			:value="storePicker.value"
			:options="storePicker.list"
			:level="2"
			default-type="name"
			:default-props="storePicker.pickerKey"
			@confirm="handleStorePickerConfirm"
			ref="batchOperatePicker"
		/>
	</view>
</template>

<script>
import apiMethods from '../../utils/apiMethods.js';
import RELIC_API_URL from '../../api/relicApi.js';
import STORE_API_URL from '../../api/storeApi.js';
export default {
	onShow() {
		this.roleList = uni.getStorageSync('userInfo').roleList || this.$store.getters.getUserInfo.roleList
	},
	data() {
		return {
			roleList: [],
			questionInfo: {
				visible: false
			},
			uploadImageUrl: 'http://test2.xkspbz.com/images/up.php',
			// uploadImageUrl: 'http://192.168.196.71/images/up.php',
			storePicker: {
				value: '',
				list: [],
				pickerKey: { label: 'name', value: 'id', children: 'children' }
			},
			operationCode: '',
			operationModal: {
				visible: false,
				value: '',
				title: '',
				label: ''
			},
			moreOperationList: [
				{
					icon: '\ue8b4',
					text: '盘点',
					operationCode: 7,
					hoverClass: 'navigator-hover'
				},
				{
					icon: '\ue88d',
					text: '入库',
					operationCode: 0,
					hoverClass: 'navigator-hover'
				},
				{
					icon: '\ue88e',
					text: '移动',
					operationCode: 1,
					hoverClass: 'navigator-hover'
				},
				{
					icon: '\ue882',
					text: '离馆',
					operationCode: 6,
					hoverClass: 'navigator-hover'
				},
				{
					icon: '\ue8d6',
					text: '修复',
					operationCode: 4,
					hoverClass: 'hover-class-bottom-left'
				},
				{
					icon: '\ue8e3',
					text: '修复完成',
					operationCode: 5,
					hoverClass: 'navigator-hover'
				},
				{
					icon: '\ue885',
					text: '外借',
					operationCode: 2,
					hoverClass: 'navigator-hover'
				},
				{
					icon: '\ue884',
					text: '归还',
					operationCode: 3,
					hoverClass: 'hover-class-bottom-right'
				}
			]
		};
	},
	methods: {
		getStoreList(params = {}) {
			/**
			 * 获得仓库级联框
			 */
			uni.showLoading({
				title: '正在加载'
			});
			apiMethods
				.getObject(STORE_API_URL.getStoreListByCascade, params)
				.then(result => {
					const { data, statusCode } = result;
					if (statusCode !== 200)
						return this.$refs.listIndexToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '获取仓库列表失败，请稍后重试',
							duration: 2000
						});
					this.storePicker.list = data;
					uni.hideLoading();
					this.$refs.batchOperatePicker.show();
				})
				.catch(error => {
					this.$refs.listIndexToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		handleTakePhoto() {
			/**
			 * 拍照录入
			 */
			uni.chooseImage({
				count: 1,
				success: ({ tempFiles }) => {
					uni.showLoading({
						title: '上传中'
					});

					const file = tempFiles[0];

					const isLt10Mb = file.size / 1024 / 1024 < 10;
					if (!isLt10Mb)
						return this.$refs.listIndexToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '上传图片大小不能超过10M！',
							duration: 2000
						});

					const uploadTask = uni.uploadFile({
						url: this.uploadImageUrl,
						filePath: file.path,
						name: 'uploadedfile',
						success: ({ data }) => {
							const imageId = JSON.parse(data).id;

							apiMethods
								.postObject(RELIC_API_URL.uploadWaitImage, {
									details: '',
									images: [imageId]
								})
								.then(result => {
									const { statusCode } = result;
									if (statusCode !== 200) {
										this.$refs.listIndexToast.show({
											icon: true,
											imgUrl: '../../static/image/toast/fail.png',
											title: '上传失败，请稍后再试',
											duration: 2000
										});
									} else {
										uni.hideLoading();
										this.$refs.listIndexToast.show({
											icon: true,
											imgUrl: '../../static/image/toast/check.png',
											title: '上传成功',
											duration: 2000
										});
									}
								})
								.catch(error => {
									this.$refs.listIndexToast.show({
										icon: true,
										imgUrl: '../../static/image/toast/fail.png',
										title: error.response,
										duration: 2000
									});
								});
						}
					});
					uploadTask.onProgressUpdate(({ progress }) => {
						return progress < 100
							? uni.showLoading({
									title: `正在上传：${progress}%`
							  })
							: false;
					});
				}
			});
		},
		handleScanCode() {
			/**
			 * 扫码查看详情
			 */
			uni.scanCode({
				onlyFromCamera: false,
				scanType: ['qrCode'],
				success: ({ result: relicId }) => {
					apiMethods.getObjectById(RELIC_API_URL.getRelicById, relicId).then(result => {
						const { statusCode } = result;
						if (statusCode === 200) {
							uni.navigateTo({
								url: `../details/index?id=${relicId}`
							});
						} else {
							this.$refs.listIndexToast.show({
								icon: true,
								imgUrl: '../../static/image/toast/fail.png',
								title: '未找到该文物，请扫描正确的文物二维码',
								duration: 2000
							});
						}
					});
				}
			});
		},
		handleQuestionModalShow() {
			/**
			 * 问题保障弹窗显示
			 */
			this.questionInfo.visible = true;
		},
		handleoperationModalShow(title, label) {
			/**
			 * 展示输入框
			 */
			this.operationModal.title = title;
			this.operationModal.label = label;
			this.operationModal.visible = true;
		},
		handleoperationModalCancel() {
			/**
			 * 输入弹出层取消事件
			 */
			this.operationModal.visible = false;
			this.operationModal.value = '';
		},
		handleoperationModalConfirm() {
			/**
			 * 输入弹出层确认事件
			 */
			if (this.operationModal.value === '') {
				setTimeout(() => {
					this.$refs.listIndexOptModal.clearLoading();
				}, 2000);

				return this.$refs.listIndexToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: this.operationModal.title,
					duration: 2000
				});
			}
			this.handleToOperate(this.operationCode, '', this.operationModal.value);
			this.handleoperationModalCancel();
		},
		handleToOperate(operationCode, storageId = '', value = '') {
			/**
			 * @param {Object} operationCode 操作码
			 * @param {Object} storageId 仓库id
			 * @param {Object} value
			 */
			uni.navigateTo({
				url: `../operate/index?operationCode=${operationCode}&storageId=${storageId}&value=${value}`
			});
		},
		handleDetermineOperation(operationCode) {
			/**
			 * @param {Object} operationCode 操作码
			 * 根据操作码选择要进行的操作
			 */
			this.operationCode = operationCode;
			switch (operationCode) {
				case 0:
				case 1:
				case 7:
					this.getStoreList();
					break;
				case 3:
				case 4:
				case 5:
					this.handleToOperate(this.operationCode);
					break;
				case 2:
					this.handleoperationModalShow('请输入外借单位', '外借单位');
					break;
				case 6:
					this.handleoperationModalShow('请输入离馆去向', '离馆去向');
					break;
				default:
					break;
			}
		},
		handleStorePickerConfirm({ value }) {
			/**
			 * 文物仓库选择器确认事件
			 */
			const storageId = value[1];
			this.handleToOperate(this.operationCode, storageId, this.operationModal.value);
		}
	},
	computed: {
		isCanManageRelic() {
			/**
			 * 是否拥有 文物管理（1100）的权限
			 */
			return !!this.roleList.includes(1000);
		},
		isCanManageRecord() {
			/**
			 * 是否拥有 操作记录管理（2000）的权限
			 */
			return !!this.roleList.includes(2000);
		},
		isCanManagePermission() {
			/**
			 * 是否拥有 权限管理（3000）的权限
			 */
			return !!this.roleList.includes(3000);
		},
		isCanManageStore() {
			/**
			 * 是否拥有 仓库管理（4000）的权限
			 */
			return !!this.roleList.includes(4000);
		},
		isCanManageUser() {
			/**
			 * 是否拥有 用户管理（5000）的权限
			 */
			return !!this.roleList.includes(5000);
		},
		isCanUseRelicList() {
			/**
			 * 是否拥有 文物列表（1100）的权限
			 */
			return !!this.roleList.includes(1100);
		},
		isCanUseWaitList() {
			/**
			 * 是否拥有 待入库列表（1200）的权限
			 */
			return !!this.roleList.includes(1200);
		},
		isCanUseRecordList() {
			/**
			 * 是否拥有 记录列表（2100）的权限
			 */
			return !!this.roleList.includes(2100);
		},
		isCanUseRoleList() {
			/**
			 * 是否拥有 角色列表（3200）的权限
			 */
			return !!this.roleList.includes(3200);
		},
		isCanUsePermissionList() {
			/**
			 * 是否拥有 权限列表（3100）的权限
			 */
			return !!this.roleList.includes(3100);
		},
		isCanUseStoreList() {
			/**
			 * 是否拥有 仓库列表（4100）的权限
			 */
			return !!this.roleList.includes(4100);
		},
		isCanUseUserList() {
			/**
			 * 是否拥有 用户列表（5100）的权限
			 */
			return !!this.roleList.includes(5100);
		},
		isCanEditRelicStates() {
			/**
			 * 是否拥有 文物状态修改（1103）的权限
			 */
			return !!this.roleList.includes(1103);
		},
		isCanSeeRelicDetails() {
			/**
			 * 是否拥有 查看文物详情（1104） 的权限
			 */
			return !!this.roleList.includes(1104);
		},
		isCanTakePhotos() {
			/**
			 * 是否拥有 拍照入库（1201） 的权限
			 */
			return !!this.roleList.includes(1201);
		}
	}
};
</script>

<style lang="scss">
.index-wrapper {
	.index-title-wrapper {
		padding: 40rpx;
		margin-top: 10rpx;
		padding-bottom: 16rpx;

		.index-title-container {
			display: flex;
			flex-direction: column;
			align-items: center;
			// width: 100%;
			height: 100%;
			padding: 40rpx;
			box-shadow: 1rpx 4rpx 14rpx 0 rgba(0, 0, 0, 0.1);
			border-radius: 20rpx;
		}

		image {
			width: 334rpx;
			height: 100rpx;
		}

		.index-title {
			position: relative;
			font-size: 36rpx;
			color: $default_font_color;
			margin-top: 30rpx;

			text {
				position: absolute;
				top: -6rpx;
				right: -80rpx;
				font-size: 20rpx;
				color: $secondary_font_color;
			}
		}
	}

	.index-btn-wrapper {
		display: flex;

		padding: $lg_font_size 40rpx;
		.btn-item {
			flex: 1;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			padding: 10rpx 0;
			i {
				font-size: 56rpx;
			}
			text {
				padding: 10rpx 0;
				font-size: $uni-font-size-sm;
			}
		}
	}

	.index-list-wrapper {
		margin: 40rpx;
		border-radius: 23rpx;
		border-bottom: 1rpx solid #f1f1f1;
		box-shadow: 1rpx 4rpx 14rpx 0 rgba(0, 0, 0, 0.1);
		.list-group {
			.list-title {
				width: 100%;
				padding: 16rpx 28rpx;
				box-sizing: border-box;
				font-size: 24rpx;
				line-height: 24rpx;
				color: #666;
				background-color: #fafafa;
			}

			.list-item {
				position: relative;
				display: flex;
				align-items: center;
				font-size: $default_font_size;
				color: rgb(51, 51, 51);
				padding: 26rpx 30rpx;

				.list-icon {
					margin-right: 16rpx;
					font-size: 40rpx;
				}

				&::after {
					position: absolute;
					content: '\e8f1';
					right: 30rpx;
					font-family: 'iconfont' !important;
					font-style: normal;
					-webkit-font-smoothing: antialiased;
					-webkit-text-stroke-width: 0.2px;
					-moz-osx-font-smoothing: grayscale;
				}
			}
		}
	}

	.index-more-wrapper {
		margin: 40rpx;
		border-radius: 23rpx;
		border-bottom: 1rpx solid #f1f1f1;
		box-shadow: 1rpx 4rpx 14rpx 0 rgba(0, 0, 0, 0.1);
		margin-top: $lg_font_size;
		.more-title {
			width: 100%;
			padding: 16rpx 28rpx;
			box-sizing: border-box;
			font-size: 24rpx;
			line-height: 24rpx;
			color: #666;
			background-color: #fafafa;
		}

		.more-group {
			display: flex;
			flex-wrap: wrap;

			.group-item {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				width: calc(100% / 4);
				height: 170rpx;
				color: $default_font_color;

				i {
					font-size: 50rpx;
					margin-bottom: 4rpx;
					color: #333;
				}

				text {
					font-size: $uni-font-size-base;
				}
			}
		}
	}

	.modal-wrapper {
		padding: $uni-font-size-lg;
		display: flex;
		align-items: center;
		justify-content: center;
		image {
			width: 540rpx;
			height: 540rpx;
		}
	}

	.hover-class-radius {
		background-color: rgba(0, 0, 0, 0.1);
		opacity: 0.7;
		border-bottom-left-radius: 22rpx;
		border-bottom-right-radius: 22rpx;
	}

	.hover-class-bottom-left {
		background-color: rgba(0, 0, 0, 0.1);
		opacity: 0.7;
		border-bottom-left-radius: 22rpx;
	}

	.hover-class-bottom-right {
		background-color: rgba(0, 0, 0, 0.1);
		opacity: 0.7;
		border-bottom-right-radius: 22rpx;
	}

	.btn-success {
		color: #19be6b;
	}

	.btn-primary {
		color: $primary_color;
	}

	.btn-danger {
		color: #fc5c65;
	}
}
</style>
