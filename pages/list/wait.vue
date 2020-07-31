<template>
	<view class="wait-wrapper">
		<!-- 导航栏 -->
		<uni-nav-bar
			left-icon="back"
			left-text="返回"
			right-text="筛选"
			title="待入库文物列表"
			:status-bar="true"
			:fixed="true"
			@clickLeft="handleGoBack"
			@clickRight="handleFilterDrawerShow"
		/>

		<!-- 搜索框 -->
		<view class="search-wrapper"><uni-search-bar placeholder="请输入要搜索的待入库编号" :radius="100" @confirm="handleSearch" @cancel="handleSearchCancel" /></view>

		<!-- 列表 -->
		<view class="list-wrapper">
			<view class="wait-item" v-for="item in listData" :key="item.id" @click="handleDetailsShow(item)" v-if="listData.length > 0">
				<view class="item-left">
					<!-- <image :src="formatSmallImgPath(item.images[0])" style="width: 200rpx;height: 200rpx;"></image> -->
					<u-lazy-load
						:image="formatSmallImgPath(item.images[0])"
						threshold="300"
						img-mode="aspectFill"
						style="width: 200rpx;height: 200rpx;"
						border-radius="10"
					></u-lazy-load>
				</view>
				<view class="item-right">
					<view class="item-id">
						编号：
						<text>{{ item.id }}</text>
					</view>
					<!-- 		<view class="item-operator">
					录入人员：
					<text>odd</text>
				</view> -->
					<view class="item-footer-wrapper">
						<view class="item-time">
							创建时间：
							<text>{{ item.createDate | formatDataDate }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 暂无数据 -->
		<u-empty class="no-data" text="暂无数据" mode="data" v-if="listData.length === 0"></u-empty>

		<!-- 分页 -->
		<uni-pagination :total="total" :current="currentPage" :pageSize="pageSize" @change="handlePageChange" v-if="listData.length > 0" />

		<!-- 弹出层 -->
		<uni-popup ref="waitOperationPopup" type="center">
			<view class="popup-wrapper">
				<view class="popup-title">请选择您要进行的操作</view>
				<view class="popup-image"><image :src="waitRelicInfo ? formatSmallImgPath(waitRelicInfo.images[0]) : ''" style="width: 260rpx;height: 260rpx;"></image></view>
				<view class="popup-id">
					编号：
					<text>{{ waitRelicInfo.id }}</text>
				</view>
				<!-- 	<view class="popup-operator">
					录入人员：
					<text>odd</text>
				</view> -->
				<view class="popup-time">
					创建时间：
					<text>{{ waitRelicInfo.createDate | formatDataDate }}</text>
				</view>

				<view class="popup-footer">
					<view class="btn-confirm" @click="handleStorePickerShow" v-if="isCanEnterStore">确认入库</view>
					<view class="btn-delete" @click="handleDeleteRelic" v-if="isCanDeleteWaitRelic">删除文物</view>
				</view>
			</view>
		</uni-popup>

		<!-- 抽屉 -->
		<uni-drawer :visible="filterDrawerVisible" mode="right" ref="waitFilterDrawer">
			<view class="drawer-wrapper">
				<view class="draw-item">
					<view class="time-title">
						开始日期：
						<text>{{ datePicker.startTime | formatDate }}</text>
					</view>
					<view class="time-title">
						结束日期：
						<text>{{ datePicker.endTime | formatDate }}</text>
					</view>
				</view>

				<view class="draw-item" style="font-size: 26rpx;" hover-class="btn-picker-hover" @click="handleDatePickerShow"><view class="btn-picker">选择日期</view></view>

				<view class="drawer-footer">
					<view class="footer-btn" @click="handleFilterReset">重置</view>
					<view class="footer-btn btn-confirm" @click="handleFilterConfim">确定</view>
				</view>
				<view class="drawer-bottom"></view>
			</view>
		</uni-drawer>

		<!-- 仓库选择器 -->
		<w-picker
			mode="linkage"
			:value="storePicker.value"
			:options="storePicker.list"
			:level="2"
			default-type="name"
			:default-props="storePicker.pickerKey"
			@confirm="handleEnterStore"
			ref="waitStorePicker"
		/>

		<!-- 日期时间选择器 -->
		<mx-date-picker
			:show="datePicker.visible"
			type="rangetime"
			:value="datePicker.value"
			:show-tips="true"
			begin-text="开始"
			end-text="结束"
			:show-seconds="true"
			@confirm="handleDatePickerConfirm"
			@cancel="handleDatePickerCancel"
		/>

		<tui-toast ref="listWaitToast"></tui-toast>
	</view>
</template>

<script>
import apiMethods from '../../utils/apiMethods.js';
import RELIC_API_URL from '../../api/relicApi.js';
import STORE_API_URL from '../../api/storeApi.js';
import RECODE_API_URL from '../../api/recordApi.js';
import formatUtils from '../../utils/formatUtils.js';
import MxDatePicker from '@/components/mx-datepicker/mx-datepicker.vue';
export default {
	components: {
		MxDatePicker
	},
	onLoad() {
		this.getWaitList();
	},
	onShow() {
		this.roleList = uni.getStorageSync('userInfo').roleList || this.$store.getters.getUserInfo.roleList
	},
	data() {
		return {
			roleList:[],
			waitRelicInfo: '',
			listData: [],
			total: 0,
			pageSize: 10,
			currentPage: 0,
			filterDrawerVisible: false,
			searchValue: '',
			datePicker: {
				value: '',
				visible: false,
				startTime: '',
				endTime: ''
			},
			storePicker: {
				list: [],
				pickerKey: { label: 'name', value: 'id', children: 'children' },
				id: '',
				name: '',
				address: ''
			}
		};
	},
	methods: {
		getWaitList(params = {}) {
			/**
			 * 获取待入库列表
			 */
			uni.showLoading({
				title: '正在加载'
			});
			if (this.datePicker.startTime) params.startTime = formatUtils.formatISODate(this.datePicker.startTime);
			if (this.datePicker.endTime) params.endTime = formatUtils.formatISODate(this.datePicker.endTime);
			apiMethods
				.getObject(RELIC_API_URL.getWaitRelicListByFilter, params)
				.then(result => {
					const { data, statusCode } = result;
					if (statusCode !== 200)
						return this.$refs.listWaitToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '获取待入库列表失败，请稍后重试',
							duration: 2000
						});

					this.listData = data.content;
					this.total = data.totalElements;
					this.pageSize = data.size;
					this.currentPage = data.number + 1;

					uni.hideLoading();
				})
				.catch(error => {
					this.$refs.listWaitToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		getWaitRelicById(id) {
			apiMethods
				.getObjectById(RELIC_API_URL.getWaitRelicById, id)
				.then(result => {
					const { data } = result;
					this.listData = [data];
					this.total = 1;
					this.pageSize = 1;
					this.currentPage = 1;
				})
				.catch(error => {
					this.$refs.listWaitToast.show({
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
			uni.showLoading({
				title: '正在加载'
			});
			apiMethods
				.getObject(STORE_API_URL.getStoreListByCascade, params)
				.then(result => {
					const { data, statusCode } = result;
					if (statusCode !== 200){
						return this.$refs.listWaitToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '获取仓库列表失败，请稍后重试',
							duration: 2000
						});
					}
					uni.hideLoading();
					this.storePicker.list = data;				
				})
				.catch(error => {
					this.$refs.listWaitToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		handleStorePickerShow() {
			/**
			 * 展示仓库级联框
			 */
			this.getStoreList();
			this.$refs.waitStorePicker.show();
		},
		handleEnterStore({ value }) {
			/**
			 * 确认入库
			 */
			this.storePicker.id = value[1];
			apiMethods
				.postObject(RECODE_API_URL.insertRecordByType.replace(/type/, 0), {
					details: '',
					params: {},
					relicsId: this.waitRelicInfo.id,
					storageId: this.storePicker.id
				})
				.then(result => {
					const { data, statusCode } = result;
					if (statusCode !== 200)
						return this.$refs.listWaitToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '文物入库失败，请稍后重试',
							duration: 2000
						});

					this.$refs.listWaitToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/check.png',
						title: '入库成功',
						duration: 2000
					});

					this.getWaitList({
						page: this.currentPage - 1,
						size: this.pageSize
					});
					this.$refs.waitOperationPopup.close();
				})
				.catch(error => {
					this.$refs.listWaitToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		handleDeleteRelic() {
			/**
			 * 删除文物
			 */
			apiMethods
				.deleteObjectById(RELIC_API_URL.deleteWaitRelicById, this.waitRelicInfo.id)
				.then(result => {
					const { data, statusCode } = result;
					if (statusCode !== 200)
						return this.$refs.listWaitToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '文物删除失败，请稍后重试',
							duration: 2000
						});

					this.$refs.listWaitToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/check.png',
						title: '文物删除成功',
						duration: 2000
					});

					this.getWaitList({
						page: this.currentPage - 1,
						size: this.pageSize
					});
					this.$refs.waitOperationPopup.close();
				})
				.catch(error => {
					this.$refs.listWaitToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		handleDetailsShow(item) {
			/**
			 * 展示操作记录内瓤
			 */
			this.waitRelicInfo = item;
			this.$refs.waitOperationPopup.open();
		},
		handlePageChange({ current }) {
			/**
			 * 页数改变事件
			 */
			this.getWaitList({
				page: current - 1,
				size: this.pageSize
			});
		},
		handleSearch({ value }) {
			/**
			 * 确认搜索
			 */
			this.searchValue = value;
			this.searchValue === '' ? this.getWaitList() : this.getWaitRelicById(this.searchValue);
		},
		handleSearchCancel() {
			/**
			 * 取消搜索
			 */
			this.searchValue = '';
		},
		handleFilterDrawerShow() {
			/**
			 * 展示筛选抽屉
			 */
			this.$refs.waitFilterDrawer.open();
		},
		handleFilterDrawerClose() {
			/**
			 * 关闭筛选抽屉
			 */
			this.$refs.waitFilterDrawer.close();
		},
		handleDatePickerShow() {
			/**
			 * 展示日期时间选择器
			 */
			this.datePicker.visible = true;
			this.handleFilterDrawerClose();
		},
		handleDatePickerConfirm(e) {
			/**
			 * 日期时间选择器确认事件
			 */
			this.datePicker.startTime = e.date[0];
			this.datePicker.endTime = e.date[1];
			this.datePicker.visible = false;
			this.handleFilterDrawerShow();
		},
		handleDatePickerCancel() {
			/**
			 * 日期时间选择器取消事件
			 */
			this.datePicker.visible = false;
			this.handleFilterDrawerShow();
		},
		handleFilterReset() {
			/**
			 * 重置筛选
			 */
			this.datePicker.startTime = '';
			this.datePicker.endTime = '';
			this.getWaitList();
		},
		handleFilterConfim() {
			/**
			 * 确认筛选
			 */
			this.getWaitList();
			this.handleFilterDrawerClose();
		},
		handleGoBack() {
			/**
			 * 返回首页
			 */
			uni.switchTab({ url: '/pages/list/index' });
		},
		formatSmallImgPath(imgName) {
			return formatUtils.formatImgPath(imgName, 'small');
		}
	},
	filters: {
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
		isCanEnterStore () {
		      /**
		       * 判断是否拥有 文物确认入库（1202） 的权限
		       */
		      return !!this.roleList.includes(1202)
		    },
		    isCanDeleteWaitRelic () {
		      /**
		       * 判断是否拥有 删除文物（1203） 的权限
		       */
		      return !!this.roleList.includes(1203)
		    }
	}
};
</script>

<style lang="scss">
uni-page-body {
	height: 100%;
}
.wait-wrapper {
	height: 100%;
	.search-wrapper {
		margin: 10rpx 10rpx -10rpx 10rpx;
	}

	.wait-item {
		display: flex;
		padding: 10rpx;
		border-bottom: 1rpx solid #eee;

		&:last-child {
			border: none;
		}

		.item-left {
			display: flex;
			align-items: center;
			padding: 10rpx;

			image {
				border-radius: 10rpx;
			}
		}

		.item-right {
			position: relative;
			flex: 1;
			padding: 10rpx;

			.item-id {
				font-size: $uni-font-size-lg;
				margin-bottom: 14rpx;
				text {
					font-size: $uni-font-size-base;
					color: $secondary_font_color;
				}
			}

			.item-operator {
				font-size: $uni-font-size-base;
				text {
					color: $default_font_color;
				}
			}

			.item-footer-wrapper {
				position: absolute;
				bottom: 0;

				.item-time {
					font-size: $uni-font-size-base;
					text {
						font-size: 24rpx;
						color: $default_font_color;
					}
				}
			}
		}
	}

	.no-data {
		height: 700rpx;
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

		.time-title {
			font-size: 29rpx;
			text {
				font-size: 27rpx;
				color: $default_font_color;
			}
		}

		.btn-picker {
			font-size: $uni-font-size-base;
			text-align: center;
		}

		.btn-picker-hover {
			color: $primary_color;
		}

		.draw-item {
			padding: $default_font_size;
			margin-bottom: 40rpx;
			border-radius: 20rpx;
			background-color: #fff;
			// box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.1);

			.type-item {
				display: inline-block;
				margin-right: 22rpx;
				margin-bottom: 20rpx;
				padding: 8rpx 38rpx;
				background-color: #eee;
				border-radius: 18rpx;
				font-size: $uni-font-size-base;

				&:nth-child(3n) {
					margin-right: 0;
				}
			}

			.type-item-active {
				background-color: $primary_color;
				color: #fff;
			}
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

	.popup-wrapper {
		position: relative;
		width: 625rpx;
		height: 650rpx;
		padding: 35rpx;
		box-sizing: border-box;
		background-color: #fff;
		border-radius: 20rpx;
		box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

		.popup-title {
			font-size: $lg_font_size;
			text-align: center;
			margin-bottom: $default_font_size;
		}

		.popup-id,
		.popup-operator {
			font-size: $default_font_size;
			margin-bottom: 6rpx;
		}

		.popup-image {
			text-align: center;
		}

		.popup-time {
			font-size: $default_font_size;
			text {
				color: $default_font_color;
			}
		}

		.popup-footer {
			position: absolute;
			left: 0;
			bottom: 0;
			right: 0;
			display: flex;
			border-top: 1rpx solid #ddd;

			.btn-confirm,
			.btn-delete {
				flex: 1;
				font-size: $uni-font-size-lg;
				padding: 18rpx;
				text-align: center;
			}

			.btn-confirm {
				color: $primary_color;
			}

			.btn-delete {
				color: $danger_color;
				border-left: 1rpx solid #ddd;
			}
		}
	}
}
</style>
