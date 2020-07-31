<template>
	<view class="u-wrap">
		<uni-nav-bar
			left-icon="back"
			left-text="返回"
			:right-text="isCanInsertStore ? '新建' : ''"
			title="仓库列表"
			:status-bar="true"
			:fixed="true"
			@clickLeft="handleGoBack"
			@clickRight="handleCreatePopupShow"
		/>
		
		<view class="u-menu-wrap">
			<scroll-view scroll-y scroll-with-animation class="u-tab-view menu-scroll-view" :scroll-top="scrollTop" :scroll-into-view="itemId">
				<view v-for="(item, index) in list" :key="index" class="u-tab-item" :class="[current == index ? 'u-tab-item-active' : '']" @tap.stop="swichMenu(index)">
					<text class="u-line-1">{{ item.name }}</text>
				</view>
			</scroll-view>
			<scroll-view :scroll-top="scrollRightTop" scroll-y scroll-with-animation class="right-box" @scroll="rightScroll">
				<view class="page-view">
					<view class="class-item" :id="'item' + index" v-for="(item, index) in list" :key="index">
						<view class="item-title">
							<text>{{ item.name }}</text>
						</view>
						<view>
							<view class="thumb-box" v-for="(item1, index1) in item.children" :key="index1">
								<view class="store-item">
									<view class="item-left">
										{{index1+1}}
									</view>
									<view class="item-right">
										<view style="font-size: 26rpx;color: #262B3A;margin-bottom: 6rpx;">编号：{{ item1.id }}</view>
										<view style="font-size: 26rpx;">分柜地址：{{ item1.name }}</view>
									</view>
								</view>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>
		
		<!-- 弹出层 -->
		<u-modal
			ref="listStoreModal"
			v-model="storeInfo.visible"
			:content-slot="true"
			:show-cancel-button="true"
			title="新建仓库"
			:mask-close-able="true"
			:async-close="true"
			@cancel="handleCreateCancel"
			@confirm="handleCreateStore"
		>
			<view class="slot-content">
				<view class="modal-wrapper">
					<u-cell-group :border="false">
						<u-field v-model="storeInfo.name" label="仓库名称" placeholder="请输入仓库名称"></u-field>
						<u-field v-model="storeInfo.address" label="分柜地址" placeholder="请输入分柜地址"></u-field>
					</u-cell-group>
				</view>
			</view>
		</u-modal>
		
		<tui-toast ref="listStoreToast"></tui-toast>
	</view>
</template>
<script>
import apiMethods from '../../utils/apiMethods.js';
import STORE_API_URL from '../../api/storeApi.js';
export default {
	data() {
		return {
			roleList:[],
			scrollTop: 0, //tab标题的滚动条位置
			oldScrollTop: 0,
			current: 0, // 预设当前项的值
			menuHeight: 0, // 左边菜单的高度
			menuItemHeight: 0, // 左边菜单item的高度
			itemId: '', // 栏目右边scroll-view用于滚动的id
			menuItemPos: [],
			arr: [],
			scrollRightTop: 0, // 右边栏目scroll-view的滚动条高度
			timer: null, // 定时器
			list:[],
			searchValue: '',
			total: 0,
			pageSize: 30,
			currentPage: 0,
			storeInfo: {
				visible: false,
				name: '',
				address: ''
			}
		};
	},
	onLoad() {
		this.getStoreList()
	},
	onShow() {
		this.roleList = uni.getStorageSync('userInfo').roleList || this.$store.getters.getUserInfo.roleList
	},
	onReady() {
		this.getMenuItemTop();
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
						return this.$refs.listMailToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '获取仓库列表失败，请稍后重试',
							duration: 2000
						});
					this.list = data;
					uni.hideLoading();
					this.getMenuItemTop();
				})
				.catch(error => {
					this.$refs.listMailToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		// 点击左边的栏目切换
		async swichMenu(index) {
			if (this.arr.length == 0) {
				await this.getMenuItemTop();
			}
			if (index == this.current) return;
			this.scrollRightTop = this.oldScrollTop;
			this.$nextTick(function() {
				this.scrollRightTop = this.arr[index];
				this.current = index;
				this.leftMenuStatus(index);
			});
		},
		// 获取一个目标元素的高度
		getElRect(elClass, dataVal) {
			new Promise((resolve, reject) => {
				const query = uni.createSelectorQuery().in(this);
				query
					.select('.' + elClass)
					.fields(
						{
							size: true
						},
						res => {
							// 如果节点尚未生成，res值为null，循环调用执行
							if (!res) {
								setTimeout(() => {
									this.getElRect(elClass);
								}, 10);
								return;
							}
							this[dataVal] = res.height;
							resolve();
						}
					)
					.exec();
			});
		},
		// 观测元素相交状态
		async observer() {
			this.tabbar.map((val, index) => {
				let observer = uni.createIntersectionObserver(this);
				// 检测右边scroll-view的id为itemxx的元素与right-box的相交状态
				// 如果跟.right-box底部相交，就动态设置左边栏目的活动状态
				observer
					.relativeTo('.right-box', {
						top: 0
					})
					.observe('#item' + index, res => {
						if (res.intersectionRatio > 0) {
							let id = res.id.substring(4);
							this.leftMenuStatus(id);
						}
					});
			});
		},
		// 设置左边菜单的滚动状态
		async leftMenuStatus(index) {
			this.current = index;
			// 如果为0，意味着尚未初始化
			if (this.menuHeight == 0 || this.menuItemHeight == 0) {
				await this.getElRect('menu-scroll-view', 'menuHeight');
				await this.getElRect('u-tab-item', 'menuItemHeight');
			}
			// 将菜单活动item垂直居中
			this.scrollTop = index * this.menuItemHeight + this.menuItemHeight / 2 - this.menuHeight / 2;
		},
		// 获取右边菜单每个item到顶部的距离
		getMenuItemTop() {
			new Promise(resolve => {
				this.arr = []
				let selectorQuery = uni.createSelectorQuery();
				selectorQuery
					.selectAll('.class-item')
					.boundingClientRect(rects => {
						// 如果节点尚未生成，rects值为[](因为用selectAll，所以返回的是数组)，循环调用执行
						if (!rects.length) {
							setTimeout(() => {
								this.getMenuItemTop();
							}, 10);
							return;
						}
						rects.forEach(rect => {
							// 这里减去rects[0].top，是因为第一项顶部可能不是贴到导航栏(比如有个搜索框的情况)
							this.arr.push(rect.top - rects[0].top);
							resolve();
						});
					})
					.exec();
			});
		},
		// 右边菜单滚动
		async rightScroll(e) {
			// console.log(e)
			this.oldScrollTop = e.detail.scrollTop;
			if (this.arr.length == 0) {
				await this.getMenuItemTop();
			}
			if (this.timer) return;
			if (!this.menuHeight) {
				await this.getElRect('menu-scroll-view', 'menuHeight');
			}
			setTimeout(() => {
				// 节流
				this.timer = null;
				// scrollHeight为右边菜单垂直中点位置

				let scrollHeight = e.detail.scrollTop + 12;
				// console.log(scrollHeight)
				for (let i = 0; i < this.arr.length; i++) {
					let height1 = this.arr[i];
					let height2 = this.arr[i + 1];
					// 如果不存在height2，意味着数据循环已经到了最后一个，设置左边菜单为最后一项即可
					if (!height2 || (scrollHeight >= height1 && scrollHeight < height2)) {
						this.leftMenuStatus(i);
						return;
					}
				}
			}, 10);
		}
		,
		handleCreatePopupShow() {
			/**
			 * 打开新建仓库弹出层
			 */
			this.storeInfo.visible = true;
		},
		handleCreateCancel() {
			/**
			 * 取消新建
			 */
			this.storeInfo.visible = false;
			this.storeInfo.name = '';
			this.storeInfo.address = '';
		},
		handleCreateStore() {
			/**
			 * 	新建仓库
			 */
			const name = this.storeInfo.name.trim();
			const address = this.storeInfo.address.trim();
			if (name === '') {
				setTimeout(() => {
					this.$refs.listStoreModal.clearLoading();
				}, 2000);
		
				return this.$refs.listStoreToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入仓库名称',
					duration: 2000
				});
			}
		
			if (address === '') {
				setTimeout(() => {
					this.$refs.listStoreModal.clearLoading();
				}, 2000);
		
				return this.$refs.listStoreToast.show({
					icon: true,
					imgUrl: '../../static/image/toast/info.png',
					title: '请输入分柜地址',
					duration: 2000
				});
			}
		
			apiMethods
				.postObject(STORE_API_URL.insertStore, {
					name: name.trim(),
					address: address.trim()
				})
				.then(result => {
					const { statusCode,data } = result;
					if (statusCode !== 201) {
						setTimeout(() => {
							this.$refs.listStoreModal.clearLoading();
						}, 2000);
		
						return this.$refs.listStoreToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: data.message,
							duration: 2000
						});
					}
		
					this.$refs.listStoreToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/check.png',
						title: '新建成功',
						duration: 2000
					});
					uni.redirectTo({
						url:'./store'
					})
					this.handleCreateCancel();
				})
				.catch(error => {
					setTimeout(() => {
						this.$refs.listStoreModal.clearLoading();
					}, 2000);
		
					this.$refs.listStoreToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		handleSearch({ value }) {
			/**
			 * 确认搜索
			 */
			this.searchValue = value;
			this.getStoreList();
		},
		handleSearchCancel() {
			/**
			 * 取消搜索
			 */
			this.searchValue = '';
		},
		handleGoBack() {
			/**
			 * 返回首页
			 */
			uni.switchTab({ url: '/pages/list/index' });
		},
	},
	computed:{
		isCanInsertStore(){
			/**
			 * 判断是否拥有 新增仓库（4101） 的权限
			 */
			return !!this.roleList.includes(4101);
		}
	}
};
</script>

<style lang="scss" scoped>
.u-wrap {
	height: calc(100vh);
	/* #ifdef H5 */
	height: calc(100vh - var(--window-top));
	/* #endif */
	display: flex;
	flex-direction: column;
}

.u-search-box {
	padding: 18rpx 30rpx;
}

.u-menu-wrap {
	flex: 1;
	display: flex;
	overflow: hidden;
}

.u-search-inner {
	background-color: rgb(234, 234, 234);
	border-radius: 100rpx;
	display: flex;
	align-items: center;
	padding: 10rpx 16rpx;
}

.u-search-text {
	font-size: 26rpx;
	color: $u-tips-color;
	margin-left: 10rpx;
}

.u-tab-view {
	width: 200rpx;
	height: 100%;
	border-right: 1rpx solid #eee;
}

.u-tab-item {
	height: 110rpx;
	background: #f6f6f6;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 26rpx;
	color: #444;
	font-weight: 400;
	line-height: 1;
}

.u-tab-item-active {
	position: relative;
	color: #000;
	font-size: 28rpx;
	font-weight: 600;
	background: #fff;
}

.u-tab-item-active::before {
	content: '';
	position: absolute;
	border-left: 4px solid $u-type-primary;
	height: 32rpx;
	left: 0;
	top: 39rpx;
}

.u-tab-view {
	height: 100%;
}

.right-box {
	background-color: rgb(250, 250, 250);
}

.page-view {
	padding: 20rpx;
}

.class-item {
	margin-bottom: 30rpx;
	background-color: #fff;
	padding: 16rpx;
	border-radius: 8rpx;
	box-shadow: 1rpx 4rpx 14rpx 0 rgba(0, 0, 0, 0.1);
}

.class-item:last-child {
	min-height: 100vh;
}

.item-title {
	font-size: $default_font_size;
	color: $u-main-color;
	font-weight: bold;
	margin-bottom: 16rpx;
	text-indent: 8rpx;
}

.item-menu-name {
	font-weight: normal;
	font-size: 24rpx;
	color: $u-main-color;
}

.item-container {
	display: flex;
	flex-wrap: wrap;
}

.thumb-box {
	
}

.store-item{
	display: flex;
	
	padding: 16rpx 0;
	.item-left{
		display: flex;
		justify-content: center;
		align-items: center;
		width: 40rpx;
		margin-right: 16rpx;
		font-size: $uni-font-size-lg;
		color: $secondary_font_color;
	}
	
	.item-right{
		flex: 1;
		
	}
}

.modal-wrapper{
	padding: 16rpx;
}

.item-menu-image {
	width: 120rpx;
	height: 120rpx;
}
</style>
