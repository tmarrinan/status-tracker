function init() {
    let query_str = decodeURIComponent(window.location.search);
    let params = new URLSearchParams(query_str);
    let ws_host = params.get("ws");
    let is_secure = params.get("secure");
    
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
