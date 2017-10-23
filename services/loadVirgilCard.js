const virgil = require('virgil-sdk');
const config = require('../config');
const errors = require('./errors');

module.exports = function makeCardLoader() {
	const virgilClient = virgil.client(
		config.virgil.accessToken,
		{
			cardsBaseUrl: config.virgil.cardsBaseUrl,
			cardsReadBaseUrl: config.virgil.cardsReadBaseUrl
		}
	);

	return (req, res, next) => {
		if (!req.userCardId) {
			console.error(
				'Invalid middleware config. ' +
				'Tried to load user\'s Virgil Card before resolving its id.'
			);
			next(errors.INTERNAL_ERROR());
			return;
		}

		virgilClient.getCard(req.userCardId)
			.then(card => {
				req.userCard = card;
				next();
			})
			.catch(e => {
				console.error('Failed to get Virgil Card by id.', e);
				next(errors.VIRGIL_CARDS_ERROR());
			});
	};
};