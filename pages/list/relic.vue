<template>
	<view class="relic-wrapper">
		<!-- 导航栏 -->
		<uni-nav-bar
			left-icon="back"
			left-text="返回"
			right-text="筛选"
			title="文物列表"
			:status-bar="true"
			:fixed="true"
			@clickLeft="handleGoBack"
			@clickRight="handleFilterDrawerShow"
		/>

		<!-- 搜索框 -->
		<view class="search-wrapper"><uni-search-bar placeholder="请输入要搜索的文物名称" :radius="100" @confirm="handleSearch" @cancel="handleSearchCancel" /></view>

		<!-- 列表 -->
		<view class="list-wrapper">
			<view class="relic-item" v-for="item in listData" :key="item.id" @click="handleDetailsShow(item.id)" v-if="listData.length > 0">
				<view class="item-left">
					<u-lazy-load :image="formatSmallImgPath(item.images[0])" threshold="300" img-mode="aspectFill"
					 style="width: 250rpx;height: 250rpx;" border-radius="10"></u-lazy-load>
					</view>
				<view class="item-right">
					<view class="item-name">{{ item.name | isAirspace }}</view>
					<view class="item-middle">
						<text :class="['item-state', formatStateClass(item.state)]">{{ item.state }}</text>
					</view>
					<view class="item-footer-wrapper">
						<text class="item-store">{{ item.store }}&nbsp;&nbsp;{{ item.address }}</text>
						<view class="item-time">
							收储时间：
							<text>{{ item.purchaseDate | formatDataDate }}</text>
						</view>
						<view class="item-time">
							录入时间：
							<text>{{ item.receiveDate | formatDataDate }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 暂无数据 -->
		<u-empty text="暂无数据" mode="data"  class="no-data" v-if="listData.length === 0"></u-empty>

		<!-- 分页 -->
		<uni-pagination class="pagination" :total="total" :current="currentPage" :pageSize="pageSize" @change="handlePageChange" v-if="listData.length > 0" />

		<uni-drawer :visible="filterDrawerVisible" mode="right" ref="relicFilterDrawer">
			<view class="drawer-wrapper">
				<view class="draw-item">
					<view class="drawer-title">状态类型：</view>
					<view>
						<view :class="['type-item', item.selected ? 'type-item-active' : '']" v-for="item in stateTypeList" :key="item.value" @click="handleTypeSelect(item.value)">
							{{ item.text }}
						</view>
					</view>
				</view>

				<view class="draw-item">
					<view class="drawer-title" style="margin-bottom: 0;" @click="handleStorePickerShow">
						选择仓库：
						<text style="font-size: 28rpx;color: #303133;">{{ storePicker.name }}&nbsp;&nbsp;&nbsp;{{ storePicker.address }}</text>
					</view>
				</view>

				<view class="draw-item">
					<view class="drawer-title">
						日期类型：
						<picker @change="handleDateTypeChange" :value="dateTypeIndex" :range="dateTypeList" style="display: inline-block;">
							<view class="uni-input">{{ dateTypeList[dateTypeIndex] }}</view>
						</picker>
					</view>
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
			@confirm="handleStorePickerConfirm"
			ref="relicStorePicker"
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
		
		<tui-toast ref="listRelicToast"></tui-toast>
	</view>
</template>

<script>
import apiMethods from '../../utils/apiMethods.js';
import RELIC_API_URL from '../../api/relicApi.js';
import STORE_API_URL from '../../api/storeApi.js';
import formatUtils from '../../utils/formatUtils.js';
import MxDatePicker from '@/components/mx-datepicker/mx-datepicker.vue';
import wPicker from '../../components/w-picker/w-picker.vue';

export default {
	components: {
		MxDatePicker,
		wPicker
	},
	onLoad() {
		this.getRelicList();
	},
	onShow() {
		this.roleList = uni.getStorageSync('userInfo').roleList || this.$store.getters.getUserInfo.roleList
	},
	data() {
		return {
			listData: [],
			roleList:[],
			total: 0,
			pageSize: 20,
			currentPage: 0,
			filterDrawerVisible: false,
			searchValue: '',
			stateNumbers: [],
			stateTypeList: [
				{
					value: 0,
					text: '在馆',
					selected: false
				},
				{
					value: 1,
					text: '外借',
					selected: false
				},
				{
					value: 2,
					text: '修复',
					selected: false
				},
				{
					value: 3,
					text: '离馆',
					selected: false
				}
			],
			dateTypeList: ['收储日期', '录入日期'],
			dateTypeIndex: 0,
			datePicker: {
				value: '',
				visible: false,
				startTime: '',
				endTime: ''
			},
			storePicker: {
				list: [],
				pickerKey: { label: 'name', value: 'name', children: 'children' },
				name: '',
				address: ''
			}
		};
	},
	methods: {
		getRelicList(params = {}) {
			/**
			 * 获得文物列表
			 */
			uni.showLoading({
				title: '正在加载'
			});
			if (this.searchValue) params.search = this.searchValue;
			if (this.stateNumbers.length > 0) params.stateNumbers = this.stateNumbers;
			params.dateNumber = this.dateTypeIndex;
			if (this.datePicker.startTime) params.startTime = formatUtils.formatISODate(this.datePicker.startTime);
			if (this.datePicker.endTime) params.endTime = formatUtils.formatISODate(this.datePicker.endTime);
			if (this.storePicker.name) params.name = this.storePicker.name;
			if (this.storePicker.address) params.address = this.storePicker.address;
			apiMethods
				.getObject(RELIC_API_URL.getRelicListByFilter, params)
				.then(result => {
					const { data, statusCode } = result;
					if (statusCode !== 200)
						return 	this.$refs.listRelicToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '获取文物列表失败，请稍后重试',
							duration: 2000
						});

					this.listData = data.content;
					this.total = data.totalElements;
					this.pageSize = data.size;
					this.currentPage = data.number + 1;
					uni.hideLoading();
				})
				.catch(error => {
					this.$refs.listRelicToast.show({
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
				title: '加载中'
			});
			apiMethods
				.getObject(STORE_API_URL.getStoreListByCascade, params)
				.then(result => {
					const { data, statusCode } = result;
					if (statusCode !== 200)
						return this.$refs.listRelicToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '获取仓库列表失败，请稍后重试',
							duration: 2000
						});

					this.storePicker.list = data;
					uni.hideLoading();
				})
				.catch(error => {
					uni.showToast({
						icon: 'none',
						title: error.response,
						duration: 2000
					});
				});
		},
		handlePageChange({ current }) {
			/**
			 * 页数改变事件
			 */
			this.getRelicList({
				page: current - 1,
				size: this.pageSize
			});
		},
		handleDetailsShow(id) {
			if(this.isCanSeeDetails){
				uni.navigateTo({
				url: `../details/index?id=${id}`
			});
			}
		},
		handleSearch({ value }) {
			/**
			 * 确认搜索
			 */
			console.log(value);
			this.searchValue = value;
			this.getRelicList();
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
			this.getStoreList();
			this.$refs.relicFilterDrawer.open();
		},
		handleFilterDrawerClose() {
			/**
			 * 关闭筛选抽屉
			 */
			this.$refs.relicFilterDrawer.close();
		},
		handleTypeSelect(value) {
			/**
			 * 筛选抽屉操作类型点击事件
			 */
			this.stateTypeList.forEach(item => {
				if (item.value === value) {
					item.selected = !item.selected;
				}
			});
		},
		handleDateTypeChange(e) {
			/**
			 * 筛选日期类型事件
			 */
			this.dateTypeIndex = e.target.value;
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
		handleStorePickerShow() {
			/**
			 * 展示仓库级联框
			 */
			this.$refs.relicStorePicker.show();
		},
		handleStorePickerConfirm(e) {
			/**
			 * 仓库级联框确认事件
			 */
			console.log(e);
			const { value } = e;
			this.storePicker.name = value[0];
			this.storePicker.address = value[1];
		},
		handleFilterReset() {
			/**
			 * 重置筛选
			 */
			this.stateTypeList.forEach(item => {
				item.selected = false;
			});
			this.stateNumbers = [];
			this.datePicker.startTime = '';
			this.datePicker.endTime = '';
			this.storePicker.name = '';
			this.storePicker.address = '';
			this.getRelicList();
		},
		handleFilterConfim() {
			/**
			 * 确认筛选
			 */
			this.stateNumbers = [];
			this.stateTypeList.forEach(item => {
				if (item.selected) {
					this.stateNumbers.push(item.value);
				}
			});
			this.getRelicList();
			this.handleFilterDrawerClose();
		},
		handleGoBack() {
			/**
			 * 返回首页
			 */
			uni.switchTab({ url: '/pages/list/index' });
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
			return formatUtils.formatImgPath(imgName, 'small');
		}
	},
	filters: {
		isAirspace(value) {
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
		isCanSeeDetails() {
			/**
			 * 是否拥有 查看文物详情（1104）的权限
			 */
			return !!this.roleList.includes(1104);
		}
	}
};
</script>

<style lang="scss">
uni-page-body {
	height: 100%;
}
.relic-wrapper {
	height: 100%;
	.search-wrapper {
		margin: 10rpx 10rpx -10rpx 10rpx;
	}

	.relic-item {
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

			.item-name {
				font-size: $uni-font-size-lg;
				margin-bottom: 14rpx;
			}

			.item-middle {
				display: flex;
				align-items: center;
				justify-content: space-between;
				margin-top: 16rpx;

				.item-state {
					color: #fff;
					padding: 2rpx 16rpx;
					border-radius: 20rpx;
					font-size: 24rpx;
				}
			}

			.item-footer-wrapper {
				position: absolute;
				bottom: 0;

				.item-store {
					margin-bottom: 16rpx;
					font-size: $uni-font-size-base;
					color: $main_font_color;
				}

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
