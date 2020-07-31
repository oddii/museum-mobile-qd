<template>
	<view class="record-wrapper">
		<!-- 导航栏 -->
		<uni-nav-bar left-icon="back" left-text="返回" :title="`该${title}操作记录`" :status-bar="true" :fixed="true" @clickLeft="handleGoBack" />

		<view class="record-container">
			<u-time-line>
				<u-time-line-item v-for="item in listData" :key="item.id" node-top="14">
					<template v-slot:node>
						<view :class="['record-dot',formatOptionTypeClass(item.relicsOptionType)]"></view>
					</template>
					<template v-slot:content>
						<view class="record-item">
							<view class="item-type">{{ item.relicsOptionType }}</view>
							<view class="item-name">文物：{{ item.optionRelicsName | isAirspace }}</view>
							<view class="item-id">编号：{{ item.id }}</view>
							<view class="item-details">{{ item.details }}</view>
							<view class="item-footer">
								<view class="item-operator">{{ item.operator }}</view>
								<view class="item-date">{{ item.optionDate | formatDataDate }}</view>
							</view>
						</view>
					</template>
				</u-time-line-item>
			</u-time-line>
		</view>
	</view>
</template>

<script>
import formatUtils from '../../utils/formatUtils.js';
export default {
	onLoad({  title, options }) {
		this.title = title
		this.listData = JSON.parse(options).reverse();
	},
	data() {
		return {
			listData: []
		};
	},
	methods: {
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
		handleGoBack() {
			/**
			 * 返回上一页
			 */
			uni.navigateBack();
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
	}
};
</script>

<style lang="scss">
.record-wrapper {
	.record-container {
		padding: 40rpx;

		.record-dot {
			width: 22rpx;
			height: 22rpx;
			border-radius: 50%;
		}

		.record-item {
			.item-type {
				font-size: $uni-font-size-lg;
				margin-bottom: 10rpx;
			}
			
			.item-name{
				font-size: $default_font_size;
				margin-bottom: 8rpx;
			}

			.item-id {
				font-size: 26rpx;
				color: $secondary_font_color;
				margin-bottom: 12rpx;
			}

			.item-details {
				margin-bottom: 20rpx;
			}

			.item-footer {
				display: flex;
				justify-content: space-between;
				align-items: center;

				.item-operator {
					color: secondary_font_color;
				}
				.item-date {
					color: $default_font_color;
					font-size: 26rpx;
				}
			}
		}
	}

	.primary-type {
		background-color: $primary_color;
	}
	
	.success-type {
		background-color: $success_color;
	}
	
	.warning-type {
		background-color: $warning_color;
	}
	
	.danger-type {
		background-color: $danger_color;
	}
	
	.info-type {
		background-color: $info_color;
	}
	
	.default-type {
		background-color: $default_font_color;
	}
}
</style>
