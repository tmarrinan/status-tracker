function init() {
    const app = {
        data() {
            return {
                mode: 'done'
            }
        },
        methods: {
            changeStatus(event) {
                if (event.target.id === 'status_done') {
                    this.mode = 'done';
                }
                else if (event.target.id === 'status_busy') {
                    this.mode = 'busy';
                }
                else if (event.target.id === 'status_stuck') {
                    this.mode = 'stuck';
                }
            }
        }
    };
    
    Vue.createApp(app).mount('#app');
}
