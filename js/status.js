function init() {
    const app = {
        data() {
            return {
                mode: "done"
            }
        }
    };
    
    Vue.createApp(app).mount('#app');
}
