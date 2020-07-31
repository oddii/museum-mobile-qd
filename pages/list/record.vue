<template>
	<view class="record-wrapper">
		<!-- 导航栏 -->
		<uni-nav-bar
			left-icon="back"
			left-text="返回"
			right-text="筛选"
			title="操作记录列表"
			:status-bar="true"
			:fixed="true"
			@clickLeft="handleGoBack"
			@clickRight="handleFilterDrawerShow"
		/>

		<!-- 列表 -->
		<view class="record-item" v-for="item in listData" :key="item.id" @click="handleDetailsShow(item)" v-if="listData.length > 0">
			<view :class="['item-left', formatOptionTypeClass(item.relicsOptionType)]">
				<text class="item-type">{{ item.relicsOptionType }}</text>
			</view>
			<view class="item-right">
				<view class="item-name">{{ item.optionRelicsName | isAirspace }}</view>
				<view class="item-more">
					<text class="item-operator">{{ item.operator }}</text>
					<text class="item-date">{{ item.optionDate | formatDate }}</text>
				</view>
			</view>
		</view>

		<!-- 暂无数据 -->
		<u-empty class="no-data" text="暂无数据" mode="data" v-if="listData.length === 0"></u-empty>

		<!-- 分页 -->
		<uni-pagination :total="total" :current="currentPage" :pageSize="pageSize" @change="handlePageChange" v-if="listData.length > 0" />

		<!-- 弹出层 -->
		<uni-popup ref="recordInfoPopup" type="center">
			<view class="details-wrapper">
				<view :class="['details-type', formatOptionTypeClass(recordInfo.relicsOptionType)]">{{ recordInfo.relicsOptionType }}</view>
				<view class="details-id">
					<text>编号：</text>
					{{ recordInfo.id }}
				</view>
				<view class="details-details">
					<text>详情：</text>
					{{ recordInfo.details }}
				</view>
				<view class="details-footer">
					<view class="details-operator">
						<text>工作人员：</text>
						{{ recordInfo.operator }}
					</view>
					<view class="details-date">
						时间：
						<text>{{ recordInfo.optionDate | formatDate }}</text>
					</view>
				</view>
			</view>
		</uni-popup>

		<!-- 筛选抽屉 -->
		<uni-drawer :visible="filterDrawerVisible" mode="right" ref="recordFilterDrawer">
			<view class="drawer-wrapper">
				<view class="draw-item">
					<view class="drawer-title">操作类型：</view>
					<view>
						<view
							:class="['type-item', item.selected ? 'type-item-active' : '']"
							v-for="item in optionsTypeList"
							:key="item.value"
							@click="handleTypeSelect(item.value)"
						>
							{{ item.text }}
						</view>
					</view>
				</view>

				<view class="draw-item">
					<view class="drawer-title">操作日期：</view>
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

		<tui-toast ref="listRecordToast"></tui-toast>
	</view>
</template>

<script>
import apiMethods from '../../utils/apiMethods.js';
import RECODE_API_URL from '../../api/recordApi.js';
import formatUtils from '../../utils/formatUtils.js';
import MxDatePicker from '@/components/mx-datepicker/mx-datepicker.vue';

export default {
	components: {
		MxDatePicker
	},
	onLoad() {
		this.getRecordList();
	},
	data() {
		return {
			recordInfo: {},
			listData: [],
			total: 0,
			pageSize: 10,
			currentPage: 0,
			filterDrawerVisible: false,
			optionNumbers: [],
			optionsTypeList: [
				{
					value: 0,
					text: '入馆',
					selected: false
				},
				{
					value: 1,
					text: '移动',
					selected: false
				},
				{
					value: 2,
					text: '外借',
					selected: false
				},
				{
					value: 3,
					text: '归还',
					selected: false
				},
				{
					value: 6,
					text: '离馆',
					selected: false
				},
				{
					value: 7,
					text: '盘点',
					selected: false
				},
				{
					value: 4,
					text: '修复',
					selected: false
				},
				{
					value: 5,
					text: '修复完成',
					selected: false
				}
			],
			datePicker: {
				value: '',
				visible: false,
				startTime: '',
				endTime: ''
			}
		};
	},
	methods: {
		getRecordList(params = {}) {
			/**
			 * 获得操作记录列表
			 */
			uni.showLoading({
				title: '正在加载'
			});
			if (this.optionNumbers) params.optionNumbers = this.optionNumbers;
			if (this.datePicker.startTime) params.startTime = formatUtils.formatISODate(this.datePicker.startTime);
			if (this.datePicker.endTime) params.endTime = formatUtils.formatISODate(this.datePicker.endTime);
			apiMethods
				.getObject(RECODE_API_URL.getRecordListByFilter, params)
				.then(result => {
					const { data, statusCode } = result;
					if (statusCode !== 200)
						return this.$refs.listRecordToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '获取操作记录列表失败，请稍后重试',
							duration: 2000
						});

					this.listData = data.content;
					this.total = data.totalElements;
					this.pageSize = data.size;
					this.currentPage = data.number + 1;
					uni.hideLoading();
				})
				.catch(error => {
					this.$refs.listRecordToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		formatOptionTypeClass(value) {
			/**
			 * 根据操作类型决定样式
			 */
			const types = {
				入馆: 'success-type',
				移动: 'primary-type',
				外借: 'info-type',
				归还: 'info-type',
				修复: 'warning-type',
				修复完成: 'warning-type',
				离馆: 'danger-type',
				盘点: 'default-type'
			};
			return types[value];
		},
		handlePageChange({ current }) {
			/**
			 * 页数改变事件
			 */
			this.getRecordList({
				page: current - 1,
				size: this.pageSize
			});
		},
		handleDetailsShow(item) {
			/**
			 * 展示操作记录详情
			 */
			this.recordInfo = item;
			this.$refs.recordInfoPopup.open();
		},
		handleFilterDrawerShow() {
			/**
			 * 展示筛选抽屉
			 */
			this.$refs.recordFilterDrawer.open();
		},
		handleFilterDrawerClose() {
			/**
			 * 关闭筛选抽屉
			 */
			this.$refs.recordFilterDrawer.close();
		},
		handleTypeSelect(value) {
			/**
			 * 筛选抽屉操作类型点击事件
			 */
			this.optionsTypeList.forEach(item => {
				if (item.value === value) {
					item.selected = !item.selected;
				}
			});
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
			this.optionsTypeList.forEach(item => {
				item.selected = false;
			});
			this.optionNumbers = [];
			this.datePicker.startTime = '';
			this.datePicker.endTime = '';
			this.getRecordList();
		},
		handleFilterConfim() {
			/**
			 * 确认筛选
			 */
			this.optionNumbers = [];
			this.optionsTypeList.forEach(item => {
				if (item.selected) {
					this.optionNumbers.push(item.value);
				}
			});
			this.getRecordList();
			this.handleFilterDrawerClose();
		},
		handleGoBack() {
			/**
			 * 返回首页
			 */
			uni.switchTab({ url: '/pages/list/index' });
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
		}
	}
};
</script>

<style lang="scss">
uni-page-body {
	height: 100%;
}
.record-wrapper {
	height: 100%;
	.record-item {
		display: flex;
		margin: 35rpx;
		border-radius: 15rpx;
		box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
		.item-left {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 160rpx;
			height: 130rpx;
			padding: 15rpx;
			font-size: $default_font_size;
		}

		.item-right {
			display: flex;
			flex: 1;
			flex-direction: column;
			justify-content: space-between;
			padding: 15rpx;
			padding-left: 30rpx;
			.item-name {
				color: $main_font_color;
				font-size: $default_font_size;
			}

			.item-more {
				display: flex;
				justify-content: space-between;
				align-items: center;
				font-size: 28rpx;
				color: $default_font_color;

				.item-date {
					padding-right: 20rpx;
					font-size: 25rpx;
					color: $secondary_font_color;
				}
			}
		}
	}

	.no-data {
		height: 700rpx;
	}

	.details-wrapper {
		position: relative;
		width: 625rpx;
		height: 550rpx;
		padding: 35rpx;
		box-sizing: border-box;
		background-color: #fff;
		border-radius: 20rpx;
		box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

		.details-type {
			border: none !important;
			text-align: center;
			margin-bottom: 35rpx;
			font-size: $lg_font_size;
		}

		.details-id,
		.details-details {
			font-size: $default_font_size;
		}

		.details-id {
			margin-bottom: 20rpx;
		}

		.details-footer {
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			padding: 35rpx;
			font-size: $default_font_size;

			.details-operator {
				margin-bottom: 20rpx;
			}

			.details-date {
				text {
					color: $default_font_color;
				}
			}
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

	.primary-type {
		color: $primary_color;
		border-right: 10rpx solid $primary_color;
	}

	.success-type {
		color: $success_color;
		border-right: 10rpx solid $success_color;
	}

	.warning-type {
		color: $warning_color;
		border-right: 10rpx solid $warning_color;
	}

	.danger-type {
		color: $danger_color;
		border-right: 10rpx solid $danger_color;
	}

	.info-type {
		color: $info_color;
		border-right: 10rpx solid $info_color;
	}

	.default-type {
		color: $default_font_color;
		border-right: 10rpx solid $default_font_color;
	}
}
</style>
