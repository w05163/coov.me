if (navigator.serviceWorker != null) {
	navigator.serviceWorker.register('sw.js')
	.then((registration) => {
		console.log('Registered events at scope: ', registration.scope);
	});
}
