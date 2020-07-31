<template>
	<view class="details-wrapper">
		<!-- 导航栏 -->
		<uni-nav-bar
			left-icon="back"
			left-text="返回"
			right-text="操作"
			title="文物详情"
			:status-bar="true"
			:fixed="true"
			@clickLeft="handleGoBack"
			@clickRight="handleOperationDrawerShow"
		/>
		<!-- 轮播图 -->
		<view class="swiper-wrapper">
			<u-swiper :list="smallImageUrls" height="750" :interval="5000" :effect3d="true" :border-radius="20" @click="handlePreviewImage"></u-swiper>
		</view>

		<!-- 详情内容 -->
		<view class="details-container">
			<view class="details-top">
				<view class="details-title">
					<text :class="['details-state', formatStateClass(relicInfo.state)]">{{ relicInfo.state }}</text>
					<text class="details-name">{{ relicInfo.name | isAirspaceName }}</text>
				</view>

				<view class="details-base">
					<view class="details-item">
						编号：
						<text>{{ relicInfo.id }}</text>
					</view>
					<view class="details-item">
						收储仓库：
						<text>{{ relicInfo.store }}</text>
					</view>
					<view class="details-item">
						分柜地址：
						<text>{{ relicInfo.address }}</text>
					</view>
				</view>
			</view>

			<view class="details-date">
				<view class="details-item">
					收储日期：
					<text>{{ relicInfo.purchaseDate | formatDataDate }}</text>
				</view>

				<view class="details-item">
					更新日期：
					<text>{{ relicInfo.receiveDate | formatDataDate }}</text>
				</view>
			</view>

			<view class="details-more">
				<view>更多信息</view>
				<view class="details-item">
					年代：
					<text>{{ relicInfo.dynasty | isAirspace }}</text>
				</view>
				<view class="details-item">
					年号：
					<text>{{ relicInfo.year | isAirspace }}</text>
				</view>
				<view class="details-item">
					来源：
					<text>{{ relicInfo.source | isAirspace }}</text>
				</view>
				<view class="details-item">
					类型：
					<text>{{ relicInfo.material | isAirspace }}</text>
				</view>
				<view class="details-item">
					数量：
					<text>{{ relicInfo.number }}</text>
				</view>
				<view class="details-item">
					尺寸：
					<text>{{ relicInfo.size | isAirspace }}</text>
				</view>
				<view class="details-item">
					收储价值：
					<text>{{ relicInfo.inValue | isAirspace }}</text>
				</view>
				<view class="details-item">
					离馆价值：
					<text>{{ relicInfo.outValue | isAirspace }}</text>
				</view>
			</view>

			<view class="details-code">
				<view>文物二维码</view>
				<view class="code-container"><canvas canvas-id="qrcode" style="width: 400rpx;height: 400rpx;" /></view>
			</view>
		</view>

		<uni-drawer :visible="operationDrawerVisible" mode="right" ref="operationDrawer">
			<view class="drawer-wrapper">
				<view class="draw-item" v-if="relicInfo.state !== '离馆' && isCanEditRelicStates">
					<view class="drawer-title">基础操作：</view>
					<view class="btn-container">
						<view class="btn-item" v-for="(item, index) in operationList" :key="index" 
						@click="handleDetermineOperate(item.type,item.code,item.text)">
							<i class="iconfont">{{ item.icon }}</i>
							<view>{{ item.text }}</view>
						</view>
					</view>
				</view>

				<view class="draw-item" v-if="isCanEditRelicInfo">
					<view class="drawer-title">图片操作：</view>
					<view class="btn-container">
						<view class="btn-item" @click="handleAddImage">
							<i class="iconfont">&#xe8de;</i>
							<view>添加</view>
						</view>
						<view class="btn-item" @click="handleToDeleteImage">
							<i class="iconfont">&#xe8e2;</i>
							<view>删除</view>
						</view>
					</view>
				</view>

				<view class="drawer-footer">
					<view class="footer-btn" @click="handleToEdit" v-if="isCanEditRelicInfo || isCanEditRelicValue">编辑信息</view>
					<view class="footer-btn btn-confirm" @click="handleToRecord">操作记录</view>
				</view>
				<view class="drawer-bottom"></view>
			</view>
		</uni-drawer>

		<!-- 弹出层 -->		
		<u-modal
			ref="editPasswordModal"
			v-model="operationModal.visible"
			:content-slot="true"
			:show-cancel-button="true"
			:title="`请输入${operationModal.title}`"
			:mask-close-able="true"
			@confirm="handleOperationModalConfirm"
			@cancel="handleOperationModalCancel"
			:async-close="true"
		>
			<view class="slot-content">
				<view class="modal-wrapper">
					<u-cell-group :border="false">
						<u-field v-model="operationModal.value" :label="operationModal.title" :placeholder="`请输入${operationModal.title}`"></u-field>
					</u-cell-group>
				</view>
			</view>
		</u-modal>

		<!-- 仓库选择器 -->
		<w-picker
			mode="linkage"
			:value="storePicker.value"
			:options="storePicker.list"
			:level="2"
			default-type="name"
			:default-props="storePicker.pickerKey"
			@confirm="handleStorePickerConfirm"
			ref="operateRelicStorePicker"
		/>

		<tui-toast ref="detailsIndexToast"></tui-toast>
	</view>
</template>

<script>
import apiMethods from '../../utils/apiMethods.js';
import RELIC_API_URL from '../../api/relicApi.js';
import STORE_API_URL from '../../api/storeApi.js';
import RECODE_API_URL from '../../api/recordApi.js';
import formatUtils from '../../utils/formatUtils.js';
import wPicker from '../../components/w-picker/w-picker.vue';
import uQRCode from '../../components/uqrcode/uqrcode.js';

export default {
	components: {
		wPicker,
		uQRCode
	},
	onLoad({ id }) {
		this.relicInfo.id = id;
		this.handleCreateQRCode();
	},
	onShow() {
		this.roleList = uni.getStorageSync('userInfo').roleList || this.$store.getters.getUserInfo.roleList
		this.getRelicById(this.relicInfo.id);
	},
	data() {
		return {
			uploadImageUrl: 'http://test2.xkspbz.com/images/up.php',
			// uploadImageUrl: 'http://192.168.196.71/images/up.php',
			relicInfo: {
				id: ''
			},
			roleList:[],
			smallImageUrls: [],
			bigImageUrls: [],
			operationDrawerVisible: false,
			operationList: [],
			operationModal: {
				visible:false,
				type: '',
				title: '',
				value: ''
			},
			storePicker: {
				type: '',
				list: [],
				pickerKey: { label: 'name', value: 'id', children: 'children' },
				name: '',
				address: ''
			}
		};
	},
	methods: {
		getRelicById(id) {
			/**
			 * 根据文物id获取文物内容
			 */
			this.smallImageUrls = [];
			this.bigImageUrls = [];
			apiMethods
				.getObjectById(RELIC_API_URL.getRelicById, id)
				.then(result => {
					const { statusCode, data } = result;
					if (statusCode !== 200) {
						this.$refs.detailsIndexToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '未找到该文物，请稍后重试',
							duration: 2000
						});
						return this.handleGoBack();
					}
					this.relicInfo = data;

					this.relicInfo.images.forEach(item => {
						this.smallImageUrls.push({ image: this.formatSmallImgPath(item) });
						this.bigImageUrls.push(this.formatBigImgPath(item));
					});

					this.getOperationList();
				})
				.catch(error => {
					this.$refs.detailsIndexToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		getStoreList(params = {}) {
			/**
			 * 获得仓库级联框
			 */
			apiMethods
				.getObject(STORE_API_URL.getStoreListByCascade, params)
				.then(result => {
					const { statusCode, data } = result;
					if (statusCode !== 200) {
						return this.$refs.detailsIndexToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '获取仓库列表失败',
							duration: 2000
						});
					}
					this.storePicker.list = data;
				})
				.catch(error => {
					this.$refs.detailsIndexToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		getOperationList() {
			/**
			 * 获得基础操作列表
			 */

			const state = this.relicInfo.state;
			this.operationList = [];

			const count = { type: 'count', code: 7, text: '盘点', icon: '\ue8b4' };
			const move = { type: 'move', code: 1, text: '移动', icon: '\ue88e' };
			const lend = { type: 'lend', code: 2, text: '外借', icon: '\ue885' };
			const lendComplete = { type: 'lendComplete', code: 3, text: '归还', icon: '\ue884' };
			const restore = { type: 'restore', code: 4, text: '修复', icon: '\ue8d6' };
			const restoreComplete = { type: 'restoreComplete', code: 5, text: '修复完成', icon: '\ue8e3' };
			const output = { type: 'output', code: 6, text: '离馆', icon: '\ue882' };

			const operate = {
				在馆: () => {
					this.operationList.push(count);
					this.operationList.push(move);
					this.operationList.push(lend);
					this.operationList.push(restore);
					this.operationList.push(output);
				},
				修复: () => {
					this.operationList.push(restoreComplete);
				},
				外借: () => {
					this.operationList.push(lendComplete);
				},
				离馆: () => {}
			};
			operate[state]();
		},
		handleDetermineOperate(type,code,title) {
			/**
			 * 根据操作码决定操作
			 */
			this.relicInfo.operationCode = code
			switch(type){
				case 'count':
				case 'move':
					this.getStoreList();
					this.$refs.operateRelicStorePicker.show();
					this.storePicker.type = type;
					break
				case 'lend':
				case 'output':	
					this.operationModal.value = '';
					this.operationModal.type = type;
					this.operationModal.title = code === 2?'外借单位':'离馆去向';
					this.$refs.operationDrawer.close();
					this.operationModal.visible = true;
					break
				case 'lendComplete':
				case 'restore':
				case 'restoreComplete':
					this.handleOperate(title)
				default:
					break;
			}
		},
		handleOperate(title){
			/**
			 * 根据操作码操作
			 */
			apiMethods
				.postObject(RECODE_API_URL.insertRecordByType.replace(/type/, this.relicInfo.operationCode), {
					details: '',
					params: {},
					relicsId: this.relicInfo.id
				})
				.then(result => {
					const { statusCode, data } = result;
			
					if (statusCode !== 200) {
						this.$refs.detailsIndexToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: `${title}失败，请稍后重试`,
							duration: 2000
						});
					} else {
						this.$refs.detailsIndexToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/check.png',
							title: `${title}成功`,
							duration: 2000
						});
					}
					this.getRelicById(this.relicInfo.id);
				})
				.catch(error => {
					this.$refs.detailsIndexToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		handleOperationModalConfirm() {
			/**
			 * 文物弹出层确认事件
			 */
			const operate = {
				lend: () => {
					apiMethods
						.postObject(RECODE_API_URL.insertRecordByType.replace(/type/, 2), {
							details: '',
							params: { lendOutTo: this.operationModal.value },
							relicsId: this.relicInfo.id
						})
						.then(result => {
							const { statusCode, data } = result;

							if (statusCode !== 200) {
								this.$refs.detailsIndexToast.show({
									icon: true,
									imgUrl: '../../static/image/toast/fail.png',
									title: '外借失败，请稍后重试',
									duration: 2000
								});
							} else {
								this.$refs.detailsIndexToast.show({
									icon: true,
									imgUrl: '../../static/image/toast/check.png',
									title: '外借成功',
									duration: 2000
								});
							}
							this.getRelicById(this.relicInfo.id);
							this.handleOperationModalCancel();
						})
						.catch(error => {
							this.$refs.detailsIndexToast.show({
								icon: true,
								imgUrl: '../../static/image/toast/fail.png',
								title: error.response,
								duration: 2000
							});
						});
				},
				output: () => {
					apiMethods
						.postObject(RECODE_API_URL.insertRecordByType.replace(/type/, 6), {
							details: '',
							params: { lendOutTo: this.operationModal.value },
							relicsId: this.relicInfo.id
						})
						.then(result => {
							const { statusCode, data } = result;

							if (statusCode !== 200) {
								this.$refs.detailsIndexToast.show({
									icon: true,
									imgUrl: '../../static/image/toast/fail.png',
									title: '离馆失败，请稍后重试',
									duration: 2000
								});
							} else {
								this.$refs.detailsIndexToast.show({
									icon: true,
									imgUrl: '../../static/image/toast/check.png',
									title: '离馆成功',
									duration: 2000
								});
							}
							this.getRelicById(this.relicInfo.id);
							this.handleOperationModalCancel();
						})
						.catch(error => {
							this.$refs.detailsIndexToast.show({
								icon: true,
								imgUrl: '../../static/image/toast/fail.png',
								title: error.response,
								duration: 2000
							});
						});
				}
			};
			operate[this.operationModal.type]();
		},
		handleOperationModalCancel() {
			this.operationModal.visible = false;
			this.$refs.operationDrawer.open();
		},
		handleStorePickerConfirm({ value }) {
			/**
			 * 文物仓库选择器确认事件
			 */
			const storageId = value[1];
			const operate = {
				count: () => {
					apiMethods
						.postObject(RECODE_API_URL.insertRecordByType.replace(/type/, 7), {
							details: '',
							params: {},
							storageId: storageId,
							relicsId: this.relicInfo.id
						})
						.then(result => {
							const { statusCode, data } = result;

							if (statusCode !== 200) {
								this.$refs.detailsIndexToast.show({
									icon: true,
									imgUrl: '../../static/image/toast/fail.png',
									title: '盘点失败，请稍后重试',
									duration: 2000
								});
							} else {
								this.$refs.detailsIndexToast.show({
									icon: true,
									imgUrl: '../../static/image/toast/check.png',
									title: '盘点成功',
									duration: 2000
								});
							}
						})
						.catch(error => {
							this.$refs.detailsIndexToast.show({
								icon: true,
								imgUrl: '../../static/image/toast/fail.png',
								title: error.response,
								duration: 2000
							});
						});
				},
				move: () => {
					apiMethods
						.postObject(RECODE_API_URL.insertRecordByType.replace(/type/, 1), {
							details: '',
							params: {},
							storageId: storageId,
							relicsId: this.relicInfo.id
						})
						.then(result => {
							const { statusCode, data } = result;

							if (statusCode !== 200) {
								this.$refs.detailsIndexToast.show({
									icon: true,
									imgUrl: '../../static/image/toast/fail.png',
									title: '移动失败，请稍后重试',
									duration: 2000
								});
							} else {
								this.$refs.detailsIndexToast.show({
									icon: true,
									imgUrl: '../../static/image/toast/check.png',
									title: '移动成功',
									duration: 2000
								});
							}
							this.getRelicById(this.relicInfo.id);
						})
						.catch(error => {
							this.$refs.detailsIndexToast.show({
								icon: true,
								imgUrl: '../../static/image/toast/fail.png',
								title: error.response,
								duration: 2000
							});
						});
				}
			};
			operate[this.storePicker.type]();
		},
		handleOperationDrawerShow() {
			/**
			 * 展示抽屉
			 */
			this.$refs.operationDrawer.open();
		},
		handleAddImage() {
			/**
			 * 添加图片
			 */
			uni.chooseImage({
				count: 1,
				success: ({ tempFiles }) => {
					if (tempFiles.length > 1) {
						return this.$refs.detailsIndexToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/info.png',
							title: '请上传单张图片',
							duration: 2000
						});
					}

					uni.showLoading({
						title: '上传中'
					});

					const file = tempFiles[0];
					const isLt10Mb = file.size / 1024 / 1024 < 10;

					if (!isLt10Mb)
						return this.$refs.detailsIndexToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/info.png',
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
								.postObject(RELIC_API_URL.uploadImageUrlsById.replace(/id/, this.relicInfo.id), [imageId])
								.then(result => {
									uni.hideLoading();
									this.$refs.detailsIndexToast.show({
										icon: true,
										imgUrl: '../../static/image/toast/check.png',
										title: '上传成功',
										duration: 2000
									});
									this.$refs.operationDrawer.close();
									this.getRelicById(this.relicInfo.id);
								})
								.catch(error => {
									this.$refs.detailsIndexToast.show({
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
		handleToDeleteImage() {
			/**
			 * 展示删除图片界面
			 */
			uni.navigateTo({
				url: `./imageDelete?id=${this.relicInfo.id}&images=${JSON.stringify(this.relicInfo.images)}`
			});
		},
		handleToEdit() {
			/**
			 * 展示编辑界面
			 */
			uni.navigateTo({
				url: `./edit?id=${this.relicInfo.id}`
			});
		},
		handleToRecord() {
			/**
			 * 展示操作记录界面
			 */
			uni.navigateTo({
				url: `./record?title=文物&options=${JSON.stringify(this.relicInfo.options)}`
			});
		},
		handleCreateQRCode() {
			/**
			 * 生成二维码
			 */

			uQRCode.make({
				canvasId: 'qrcode',
				componentInstance: this,
				text: this.relicInfo.id,
				size: 200,
				margin: 10
			});
		},
		handlePreviewImage(current) {
			/**
			 * 预览大图
			 */
			uni.previewImage({
				urls: this.bigImageUrls,
				current
			});
		},
		handleGoBack() {
			/**
			 * 返回上一页
			 */
			uni.navigateBack();
		},
		formatStateClass(value) {
			const types = {
				在馆: 'success-state',
				修复: 'warning-state',
				外借: 'info-state',
				离馆: 'danger-state'
			};
			return types[value];
		},
		formatSmallImgPath(imgName) {
			/**
			 * 格式化缩略图路径
			 */
			return formatUtils.formatImgPath(imgName, 'small');
		},
		formatBigImgPath(imgName) {
			/**
			 * 格式化大图路径
			 */
			return formatUtils.formatImgPath(imgName, 'big');
		}
	},
	filters: {
		isAirspace(value) {
			if (!value) return '无';
			else return value;
		},
		isAirspaceName(value) {
			if (!value) return '暂无名称';
			else return value;
		},
		formatDate(date) {
			if (!date) return '暂无日期';
			else return formatUtils.formatDate(date);
		},
		formatDataDate(date) {
			if (!date) return '暂无日期';
			else return formatUtils.formatDataDate(date);
		}
	},
	computed:{
		isCanEditRelicInfo () {
		      /**
		       * 判断是否拥有 文物信息修改（1101） 的权限
		       */
		      return !!this.roleList.includes(1101)
		    },
		    isCanEditRelicValue () {
		      /**
		       * 判断是否拥有 文物价值修改（1102） 的权限
		       */
		      return !!this.roleList.includes(1102)
		    },
		    isCanEditRelicStates () {
		      /**
		       * 判断是否拥有 文物状态修改（1103） 的权限
		       */
		      return !!this.roleList.includes(1103)
		    }
	}
};
</script>

<style lang="scss">
.details-wrapper {
	background-color: #f7f7f7;
	.swiper-wrapper {
		padding-top: 26rpx;
		.details-swiper {
			height: 750rpx;
		}
	}

	.details-container {
		.details-top {
			box-shadow: 1rpx 4rpx 14rpx 0 rgba(0, 0, 0, 0.1);
			margin: 30rpx;
			border-radius: 20rpx;
		}

		background-color: #f7f7f7;
		.details-title {
			padding: $default_font_size;
			background-color: #fff;
			border-top-left-radius: 20rpx;
			border-top-right-radius: 20rpx;
			.details-state {
				color: #fff;
				padding: 2rpx 16rpx;
				margin-right: 16rpx;
				border-radius: 20rpx;
				font-size: 24rpx;
			}

			.details-name {
				font-size: $uni-font-size-lg;
				font-weight: 600;
				color: #333;
			}
		}

		.details-item {
			font-size: $default_font_size;
			text {
				color: $default_font_color;
			}
		}

		.details-base {
			margin-bottom: 24rpx;
			padding: $default_font_size;
			padding-top: 0;
			background-color: #fff;
			border-bottom-left-radius: 20rpx;
			border-bottom-right-radius: 20rpx;
		}

		.details-date {
			margin-bottom: 24rpx;
			padding: 16rpx $default_font_size;
			background-color: #fff;
			box-shadow: 1rpx 4rpx 14rpx 0 rgba(0, 0, 0, 0.1);
			margin: 30rpx;
			border-radius: 20rpx;
		}

		.details-more,
		.details-code {
			box-shadow: 2rpx 4rpx 14rpx 0 rgba(0, 0, 0, 0.1);
			margin: 30rpx;
			border-radius: 20rpx;
			padding: $default_font_size;
			background-color: #fff;
			view {
				font-size: $default_font_size;

				&:first-child {
					margin-bottom: 16rpx;
					font-weight: 600;
					color: $default_font_color;
				}
			}

			.code-container {
				display: flex;
				justify-content: center;
				align-items: center;
				padding: 16rpx;
			}
		}

		.details-code {
			margin-top: 24rpx;
		}
	}

	.drawer-wrapper {
		height: 100%;
		// padding: $default_font_size ;
		margin-top: var(--status-bar-height);
		font-size: $uni-font-size-lg;
		background-color: #f7f7f7;

		.drawer-title {
			margin-bottom: $uni-font-size-lg;
		}

		.btn-container {
			display: flex;
			flex-wrap: wrap;
			width: 100%;
			.btn-item {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				width: calc(calc(100% / 3) - 20rpx);
				margin: 10rpx;
				height: 120rpx;
				box-sizing: border-box;
				// border: 1rpx solid #000;

				i {
					font-size: 50rpx;
					color: $default_font_color;
				}
				view {
					margin-top: 5rpx;
					font-size: $uni-font-size-base;
				}
			}
		}

		.draw-item {
			padding: $default_font_size;
			margin-bottom: 40rpx;
			border-radius: 20rpx;
			background-color: #fff;
			// box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.1);
		}

		.drawer-footer {
			display: flex;
			padding: $default_font_size;
			// box-shadow: 0 -6px 10px 0 rgba(0, 0, 0, 0.1);
			border-radius: 20rpx;
			background-color: #fff;

			.footer-btn {
				flex: 1;
				padding: 12rpx 0;
				margin-right: 17rpx;
				border: 1rpx solid #bbb;
				border-radius: $uni-font-size-lg;
				text-align: center;
				font-size: $uni-font-size-base;
			}

			.btn-confirm {
				margin-right: 0rpx;
				background-color: $primary_color;
				border: 1rpx solid $primary_color;
				color: #fff;
			}
		}

		.drawer-bottom {
			height: 100%;
			background-color: #fff;
		}
	}
	.modal-wrapper{
		padding: $uni-font-size-lg;;
	}

	.success-state {
		background-color: $success_color;
	}

	.warning-state {
		background-color: $warning_color;
	}

	.info-state {
		background-color: $info_color;
	}

	.danger-state {
		background-color: $danger_color;
	}
}
</style>
