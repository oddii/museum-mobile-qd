<template>
	<view class="assign-wrapper">
		<uni-nav-bar
			left-icon="back"
			left-text="返回"
			right-text="提交"
			title="分配权限"
			:status-bar="true"
			:fixed="true"
			@clickLeft="handleGoBack"
			@clickRight="handleAssignConfirm"
		/>

		<view class="assign-container">
			<ly-tree ref="roleTreeRef" :tree-data="treeData" :props="props" :showCheckbox="true" :default-expand-all="true" :defaultCheckedKeys="checkedList" node-key="id" />
		</view>

		<tui-toast ref="detailsAssignToast"></tui-toast>
	</view>
</template>

<script>
import api from '../../utils/apiMethods.js';
import PERMISSION_API_URL from '../../api/permissionApi.js';
import ROLE_API_URL from '../../api/roleApi.js';
export default {
	onLoad({ id }) {
		this.roleId = id;
		this.getAssignList();
	},
	data() {
		return {
			roleId: '',
			treeData: [],
			checkedList: [], //	默认被选中的数组
			props: {
				label: 'name',
				children: 'children'
			}
		};
	},
	methods: {
		getAssignList() {
			/**
			 * 打开分配权限模态框
			 */

			uni.showLoading({
				title: '正在加载'
			});
			api.getObject(PERMISSION_API_URL.getPermissionListByCascade)
				.then(result => {
					const { statusCode, data } = result;
					if (statusCode !== 200)
						return this.$refs.detailsAssignToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '获取权限列表失败，请稍后重试',
							duration: 2000
						});

					this.treeData = data;
				})
				.catch(error => {
					this.$refs.detailsAssignToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});

			api.getObjectById(ROLE_API_URL.getRoleById, this.roleId)
				.then(result => {
					const { statusCode, data } = result;
					if (statusCode !== 200)
						return this.$refs.detailsAssignToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '获取角色权限列表失败，请稍后重试',
							duration: 2000
						});

					this.getCheckedList(data.permissions, this.checkedList);
					this.$refs.roleTreeRef.setCheckedKeys(this.checkedList);
					uni.hideLoading();
				})
				.catch(error => {
					this.$refs.detailsAssignToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/fail.png',
						title: error.response,
						duration: 2000
					});
				});
		},
		getCheckedList(roleList, arr) {
			/**
			 * 通过递归的形式，获取角色下所有权限的id
			 */
			roleList.forEach(item => {
				if (item.children) {
					this.getCheckedList(item.children, arr);
				} else {
					return arr.push(item.id);
				}
			});
		},
		handleAssignConfirm() {
			/**
			 * 分配权限
			 */
			const checkedKeys = this.$refs.roleTreeRef.getCheckedKeys();
			const halfCheckedKeys = this.$refs.roleTreeRef.getHalfCheckedKeys();

			api.putObjectById(ROLE_API_URL.updatePermissionById, this.roleId, [...checkedKeys, ...halfCheckedKeys])
				.then(result => {
					const { statusCode, data } = result;
					if (statusCode !== 200)
						return this.$refs.detailsAssignToast.show({
							icon: true,
							imgUrl: '../../static/image/toast/fail.png',
							title: '分配失败，请稍后重试',
							duration: 2000
						});
					
					this.$refs.detailsAssignToast.show({
						icon: true,
						imgUrl: '../../static/image/toast/check.png',
						title: '分配成功',
						duration: 2000
					});
					this.getAssignList()
				})
				.catch(error => {
					this.$refs.detailsAssignToast.show({
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
	}
};
</script>

<style lang="scss"></style>
