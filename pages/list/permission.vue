<template>
	<view class="permission-wrapper">
		<!-- 导航栏 -->
		<uni-nav-bar left-icon="back" left-text="返回" title="权限列表" :status-bar="true" :fixed="true" @clickLeft="handleGoBack" />

		<view class="list-wrapper">
			<view class="item-container" v-for="item in listData" :key="item.id">
				<view class="item-left">
					<view class="item-name">{{item.name}}</view>
					<view class="item-code">权限编号：
					<text>{{item.code}}</text></view>
				</view>
				<view class="item-right">
					<u-tag text="一级" type="success" v-if="item.level===1"/>
					<u-tag text="二级" type="warning" v-else-if="item.level===2"/>
					<u-tag text="三级" type="primary" v-else-if="item.level===3"/>
				</view>
			</view>
		</view>

		<tui-toast ref="listPermissionToast"></tui-toast>
	</view>
</template>

<script>
import apiMethods from '../../utils/apiMethods.js';
import PERMISSION_API_URL from '../../api/permissionApi.js';
export default {
	onLoad() {
		this.getPermissionList();
	},
	data() {
		return {
			listData: []
		};
	},
	methods: {
		getPermissionList() {
			/**
			 * 获取权限列表
			 */
			uni.showLoading({
				title: '正在加载'
			});
			apiMethods
				.getObject(PERMISSION_API_URL.getPermissionList)
				.then(result => {
					const { data, statusCode } = result;
					if (statusCode !== 200)
						return this.$refs.listPermissionToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '获取权限列表失败，请稍后重试',
							duration: 2000
						});

					this.listData = data;
					uni.hideLoading();
				})
				.catch(error => {
					this.$refs.listPermissionToast.show({
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
	filters:{
		formatItemLevel(level){
			/**
			 * 格式化权限等级
			 */
			switch(level){
				case 1:
					return '一级'
				case 2:
					return '二级'
				case 3:
					return '三级'
			}
		}
	}
};
</script>

<style lang="scss">
.permission-wrapper{
	.list-wrapper{
		.item-container{
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 26rpx;
			padding-right: 36rpx;
			border-bottom: 1rpx solid #eee;
			.item-left{
				.item-name{
					font-size: $lg_font_size;
					margin-bottom: 4rpx;
				}
				.item-code{
					font-size: $uni-font-size-base;
					text{
						color: $secondary_font_color;
					}
				}
			}
		}
	}
}
</style>
