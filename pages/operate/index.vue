<template></template>

<script>
import apiMethods from '../../utils/apiMethods.js';
import RELIC_API_URL from '../../api/relicApi.js';
import RECODE_API_URL from '../../api/recordApi.js';
import permision from '../../utils/qrcode/permission.js';
import helper from '../../utils/qrcode/helper.js';
export default {
	onLoad({ operationCode, storageId, value }) {
		this.operationCode = parseInt(operationCode);
		this.storageId = storageId || '';
		this.value = value || '';
		this.handleScan();
	},
	data() {
		return {
			operationCode: '', //	操作码
			storageId: '', //	仓库id
			value: '', //	外借/离馆去向
			relicIdList: []
		};
	},
	methods: {
		async createBarcode() {
			/**
			 * 创建一个 barcode对象
			 */
			const currentWebview = this.$mp.page.$getAppWebview();
			// #ifdef APP-PLUS
			var barcode = null;
			if (!barcode) {
				barcode = plus.barcode.create('barcode', [plus.barcode.QR], {
					scanbarColor: '#5677fc',
					frameColor: '#5677fc'
				});
				currentWebview.append(barcode);
			}
			// #endif
			return barcode;
		},
		async checkPermission(code) {
			let status = permision.isIOS ? await permision.requestIOS('camera') : await permision.requestAndroid('android.permission.CAMERA');
			if (status === null || status === 1) {
				status = 1;
			} else {
				uni.showModal({
					content: '需要相机权限',
					confirmText: '设置',
					success: function(res) {
						if (res.confirm) {
							permision.gotoAppSetting();
						}
					}
				});
			}
			return status;
		},
		async handleScan() {
			uni.showLoading({
				title: '加载中'
			});
			let status = await this.checkPermission();
			if (status !== 1) {
				return uni.showToast({
					icon: 'none',
					title: '需要相机权限'
				});
			}
			var barcode = await this.createBarcode();
			barcode.setFlash(false);
			uni.hideLoading();
			barcode.start(); //开始识别二维码

			barcode.onmarked = (type, code) => {
				if (!this.relicIdList.includes(code)) {
					if ([0, 1, 7, 3, 4, 5].includes(this.operationCode)) {
						this.handleOperate(code);
					} else if (this.operationCode === 2) {
						this.handleOperate(code, {
							lendOutTo: this.value
						});
					} else if (this.operationCode === 6) {
						this.handleOperate(code, {
							leaveTo: this.value
						});
					}
				} else {
					uni.showToast({
						title: '请勿重复扫码，如需重扫请退出并重新进入',
						icon: 'none',
						duration: 2000
					});
				}

				setTimeout(function() {
					barcode.start(); //开始识别二维码
				}, 2000);
			};
		},
		handleOperate(relicsId, params = {}) {
			const postData = {
				details: '',
				params,
				relicsId
			};
			if (this.storageId !== '') postData.storageId = this.storageId;
			apiMethods
				.postObject(RECODE_API_URL.insertRecordByType.replace(/type/, this.operationCode), postData)
				.then(result => {
					const { statusCode, data } = result;
					if (statusCode === 200) {
						uni.showToast({
							icon:'success',
							title: '操作成功',
							duration:2000
						});
						this.relicIdList.push(relicsId);
					} else if (statusCode === 400) {
						uni.showToast({
							title: data.message,
							icon: 'none',
							duration: 2000
						});
					} else if (statusCode === 404) {
						uni.showToast({
							title: '找不到此文物',
							icon: 'none',
							duration: 2000
						});
					}
				})
				.catch(error => {
					uni.showToast({
						title: error.response,
						icon: 'none',
						duration: 2000
					});
				});
		}
	}
};
</script>

<style lang="scss"></style>
