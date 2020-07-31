<template>
	<view class="edit-wrapper">
		<!-- 导航栏 -->
		<uni-nav-bar left-icon="back" left-text="返回" right-text="提交" title="编辑信息" :status-bar="true" :fixed="true" @clickLeft="handleGoBack" @clickRight="handleSubmit" />

		<view class="edit-container">
			<view class="edit-item" v-if="isCanEditRelicInfo">
				<text class="item-label">名称</text>
				<input type="text" class="item-input" v-model="relicInfo.name" />
			</view>
			<view class="edit-item" v-if="isCanEditRelicInfo">
				<text class="item-label">年代</text>
				<input type="text" class="item-input" v-model="relicInfo.dynasty" />
			</view>
			<view class="edit-item" v-if="isCanEditRelicInfo">
				<text class="item-label">年号</text>
				<input type="text" class="item-input" v-model="relicInfo.year" />
			</view>
			<view class="edit-item" v-if="isCanEditRelicInfo">
				<text class="item-label">来源</text>
				<input type="text" class="item-input" v-model="relicInfo.source" />
			</view>
			<view class="edit-item" v-if="isCanEditRelicInfo">
				<text class="item-label">类型</text>
				<input type="text" class="item-input" v-model="relicInfo.material" />
			</view>
			<view class="edit-item" v-if="isCanEditRelicInfo">
				<text class="item-label">数量</text>
				<input type="number" class="item-input" v-model="relicInfo.number" />
			</view>
			<view class="edit-item" v-if="isCanEditRelicInfo">
				<text class="item-label">尺寸</text>
				<input type="text" class="item-input" v-model="relicInfo.size" />
			</view>
			<view class="edit-item" v-if="isCanEditRelicValue">
				<text class="item-label">收储价值</text>
				<input type="text" class="item-input" v-model="relicInfo.inValue" />
			</view>
			<view class="edit-item" v-if="isCanEditRelicValue">
				<text class="item-label">离馆价值</text>
				<input type="text" class="item-input" v-model="relicInfo.outValue" />
			</view>
		</view>

		<tui-toast ref="detailsEditToast"></tui-toast>
	</view>
</template>

<script>
import apiMethods from '../../utils/apiMethods.js';
import RELIC_API_URL from '../../api/relicApi.js';
export default {
	onLoad({ id }) {
		this.relicInfo.id = id;
		this.getRelicById(this.relicInfo.id);
	},
	onShow(){
		this.roleList = uni.getStorageSync('userInfo').roleList || this.$store.getters.getUserInfo.roleList
	},
	data() {
		return {
			relicInfo: {
				id: ''
			},
			roleList:[]
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
						this.$refs.detailsEditToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '未找到该文物，请稍后重试',
							duration: 2000
						});
						return this.handleGoBack();
					}
					this.relicInfo = data;
				})
				.catch(error => {
					this.$refs.detailsEditToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		handleSubmit() {
			/**
			 * 提交编辑
			 */
			const updateInfo = {
				address: this.relicInfo.address,
				dynasty: this.relicInfo.dynasty,
				handle: this.relicInfo.handle,
				inValue: this.relicInfo.inValue,
				material: this.relicInfo.material,
				name: this.relicInfo.name,
				number: this.relicInfo.number,
				outValue: this.relicInfo.outValue,
				size: this.relicInfo.size,
				source: this.relicInfo.source,
				store: this.relicInfo.store,
				year: this.relicInfo.year
			};

			apiMethods
				.putObjectById(RELIC_API_URL.updateRelicById, this.relicInfo.id, updateInfo)
				.then(result => {
					const { statusCode } = result;
					if (statusCode !== 200)
						return this.$refs.detailsEditToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '提交失败，请返回重试',
							duration: 2000
						});

					this.$refs.detailsEditToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/check.png',
						title: '提交成功',
						duration: 2000
					});
					// this.handleGoBack();
				})
				.catch(error => {
					this.$refs.detailsEditToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		handleGoBack() {
			/**
			 * 返回上一页
			 */
			uni.navigateBack();
		}
	},
	computed:{
		isCanEditRelicValue () {
		      /**
		       * 判断是否拥有 文物价值修改（1102） 的权限
		       */
		      return !!this.roleList.includes(1102)
		},
		isCanEditRelicInfo(){
			/**
			 * 判断是否拥有 文物信息修改（1101） 的权限
			 */
			return !!this.roleList.includes(1101)
		}
	}
};
</script>

<style lang="scss">
uni-page-body {
	height: 100%;
}
.edit-wrapper {
	height: 100%;
	background-color: #f7f7f7;

	.edit-container {
		margin-top: 20rpx;
		background-color: #fff;
		border-top: 1rpx solid #f5f5f5;
		border-bottom: 1rpx solid #f5f5f5;

		.edit-item {
			display: flex;
			align-items: center;
			padding: 10rpx 20rpx;
			border-bottom: 1rpx solid #f5f5f5;

			&:last-child {
				border-bottom: none;
			}
			.item-label {
				width: 160rpx;
				padding: 16rpx;
				font-size: $default_font_size;
			}
			.item-input {
				flex: 1;
				font-size: $uni-font-size-lg;
				color: $default_font_color;
			}
		}
	}
}
</style>
