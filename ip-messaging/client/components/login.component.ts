import { Component, ChangeDetectorRef, Input } from '@angular/core';
import { Http, Response } from '@angular/http';

import * as _ from 'lodash';

import { AccountService, Account } from '../services/account.service'
import { VirgilService } from '../services/virgil.service'
import { TwilioService } from '../services/twilio.service'
import { BackendService } from '../services/backend.service'

@Component({
    selector: 'ipm-login',
    templateUrl: './assets/views/login.component.html'
})

export class LoginComponent{
    
    @Input('onLogin') public loggedIn: Function;
    
    constructor (private http: Http,
                 private context: AccountService,
                 private virgil: VirgilService,
                 private twilio: TwilioService,
                 private backend: BackendService,
                 private cd: ChangeDetectorRef) { }
    
    public nickName: string;    
    public isBusy: boolean;
    
    public onLogin(): void {
        this.isBusy = true;
        
        let validationToken: string;
        
        this.backend.auth(this.nickName)
            .then(authData => { 
                                
                validationToken = authData.validation_token;
                
                // initialize virgil SDK using token generated on backend.
                this.virgil.initialize(authData.virgil_token);
                                
                // initialize twilio client using token generated on backend.
                this.twilio.initialize(authData.twilio_token);
                
                // search for public key for current user nickname              
                return this.virgil.sdk.cards.search({ value: authData.identity }); 
            })
            .then(cards => {      
                                                
                if (cards.length == 0) {
                    
                    // publish new public key for current user 
                    
                    return this.publish(this.nickName, validationToken);            
                }
                
                // download keys from Virgil services in case when 
                // user is already exists.
                
                let card =  _.last(_.sortBy(cards, 'created_at'));                                
                return this.download(card, validationToken);                
            })
            .then(keysBundle => {                                
                this.isBusy = false;
                
                var account = new Account(keysBundle.id, keysBundle.identity, 
                    keysBundle.publicKey, keysBundle.privateKey);
                
                this.context.setCurrentAccount(account);
                this.loggedIn();
            })
            .catch((error) => {
                throw error;
            });
    }
    
    private download(card: any, validationToken: string) : Promise<any> {
        
        // download your private key from Virgil services
        // using validation token recived from application
        // server.
        
        return this.virgil.sdk.privateKeys.get({
                virgil_card_id: card.id,
                identity: {
                    type: card.identity.type,
                    value: card.identity.value,
                    validation_token: validationToken
                }
            })
            .then(response => {                
                return { 
                    id: card.id,
                    identity: card.identity.value, 
                    publicKey: card.public_key.public_key,
                    privateKey: response.private_key                     
                };                   
            });
    } 
    
    private publish(identity: string, validationToken: string) : Promise<any> {
               
        let keyPair: any = null;
        let card: any = null;
        
        // geneareting public/private keyPair for current user.
        return this.virgil.crypto.generateKeyPairAsync()            
            .then(generatedKeyPair => {              
                                                  
                keyPair = generatedKeyPair;
                
                // prepare request for Card creation.                                
                let cardInfo = {
                    public_key: keyPair.publicKey,
                    private_key: keyPair.privateKey,
                    identity: {
                        type: 'nickname',
                        value: identity,
                        validation_token: validationToken
                    }
                }                                
                
                // create private card using application validation 
                // token. See more about validation tokens here 
                // https://virgilsecurity.com/api-docs/javascript/keys-sdk
                
                return this.virgil.sdk.cards.create(cardInfo);
            })
            .then(createdCard => {                
                card = createdCard;
                
                // store private key in a safe storage which lets you 
                // synchronize your private key between the devices and 
                // applications.
                                               
                return this.virgil.sdk.privateKeys.stash({
                    virgil_card_id: createdCard.id,
                    private_key: keyPair.privateKey
                });
            })
            .then(response => {                
                return { 
                    id: card.id,
                    identity: card.identity.value, 
                    publicKey: card.public_key.public_key,
                    privateKey: response.private_key                     
                };                
            });
    }
}