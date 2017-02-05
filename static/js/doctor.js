$(document).ready(function() {
	console.log("Ready...");

    $('#input_submit').click(function() {
		$.post('/eliza/DOCTOR', {
			human: $('#input_text').val()
		})
		.done(function(data) {
			console.log(data);
		});
	});
});
