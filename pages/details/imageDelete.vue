<template>
	<view class="image-delete-wrapper">
		<!-- 导航栏 -->
		<uni-nav-bar
			left-icon="back"
			left-text="返回"
			right-text="删除"
			title="选择图片"
			:status-bar="true"
			:fixed="true"
			@clickLeft="handleGoBack"
			@clickRight="handleImageDeletePopupShow"
		/>

		<!-- 图片选择地方 -->
		<view class="image-container">
			<view :class="['image-item ', item.selected ? 'item-selected' : '']" v-for="(item, index) in relicInfo.smallImages" :key="item.id" @click="handleImageSelect(index)">
				<image :src="item.url" />
			</view>
		</view>

		<!-- 已选择 -->
		<view class="image-selected">
			<text>已选择</text>
			<text class="image-selected-num">{{ selectedNums }}</text>
			<text>张图片</text>
		</view>

		<!-- 弹出菜单 -->		
		<tui-actionsheet
			:show="deleteImageInfo.visible"
			:itemList="deleteImageInfo.list"
			:size="26"
			:tips="`删除照片后不可恢复，确认删除 ${selectedNums} 张照片吗？`"
			@click="handleImageDelete"
			@cancel="handleImageDeleteCancel"
			:maskClosable="true"
		></tui-actionsheet>
				
		<tui-toast ref="detailsImageToast"></tui-toast>
	</view>
</template>

<script>
import apiMethods from '../../utils/apiMethods.js';
import RELIC_API_URL from '../../api/relicApi.js';
import formatUtils from '../../utils/formatUtils.js';
export default {
	onLoad({ id, images }) {
		this.relicInfo.id = id;
		JSON.parse(images).forEach(item => {
			this.relicInfo.smallImages.push({ id: item, url: this.formatSmallImgPath(item), selected: false });
			this.relicInfo.bigImages.push(this.formatBigImgPath(item));
		});
	},
	data() {
		return {
			relicInfo: {
				id: '',
				smallImages: [],
				bigImages: []
			},
			deleteImageInfo:{
				visible:false,
				list:[
					{ text: '确认删除', color: 'red', fontSize: 34 }
				]
			}
		};
	},
	methods: {
		handleImageSelect(index) {
			/**
			 * 点击图片事件
			 */
			this.relicInfo.smallImages[index].selected = !this.relicInfo.smallImages[index].selected;
		},
		handleImageDeletePopupShow() {
			/**
			 * 展示确认删除弹窗
			 */
			return this.selectedNums > 0
				? this.deleteImageInfo.visible = true
				: this.$refs.detailsImageToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请先选择图片',
					duration: 2000
				});
		},
		handleImageDeleteCancel() {
			/**
			 * 取消删除照片
			 */
			this.deleteImageInfo.visible = false
		},
		handleImageDelete() {
			/**
			 * 删除已选择的图片
			 */
			const images = [];
			this.relicInfo.smallImages.forEach(item => {
				return item.selected ? images.push(item.id) : false;
			});
			if (images.length === this.relicInfo.smallImages.length) {
				this.$refs.detailsImageToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请为此文物保留一张图片',
					duration: 2000
				});
				return this.handleImageDeleteCancel()
			}

			apiMethods
				.putObjectById(RELIC_API_URL.deleteImageUrlsById, this.relicInfo.id, images)
				.then(result => {
					const { statusCode } = result;
					if (statusCode === 200) {
						this.handleImageDeleteCancel()
						this.handleGoBack();
					}
				})
				.catch(error => {
					this.$refs.detailsImageToast.show({
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
	computed: {
		selectedNums() {
			const nums = this.relicInfo.smallImages.reduce((total, item) => {
				return item.selected ? ++total : total;
			}, 0);
			return nums;
		}
	}
};
</script>

<style lang="scss">
.image-delete-wrapper {
	.image-container {
		width: 100%;
		margin-top: 22rpx;
		.image-item {
			float: left;
			text-align: center;
			padding-left: 16rpx;
			width: 50%;
			border-radius: 20rpx;
			box-sizing: border-box;
			&:nth-child(2n) {
				padding-left: 0;
				padding-right: 16rpx;
			}
			image {
				width: 320rpx;
				height: 320rpx;
				border-radius: 20rpx;
				border: 10rpx solid #ffffff;
			}
		}

		.item-selected {
			position: relative;
			image {
				border: 10rpx solid $primary_color;

				&::after {
					position: absolute;
					bottom: 20rpx;
					right: 20rpx;
					content: '\e8e3';
					display: flex;
					justify-content: center;
					align-items: center;
					height: 40rpx;
					width: 40rpx;
					border-radius: 50%;
					background-color: $primary_color;
					font-family: 'iconfont' !important;
					font-style: normal;
					-webkit-font-smoothing: antialiased;
					-webkit-text-stroke-width: 0.2px;
					-moz-osx-font-smoothing: grayscale;
					font-size: 50rpx;
					color: #fff;
				}
			}
		}
	}

	.image-selected {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 90rpx;
		font-size: $uni-font-size-lg;
		border-top: 1rpx solid #e5e5e5;

		.image-selected-num {
			margin: 0 6rpx;
		}
	}
}
</style>
