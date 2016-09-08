//
//  AppState.swift
//  VirgilTwilioChat
//
//  Created by Pavel Gorb on 6/17/16.
//  Copyright © 2016 Virgil Security, Inc. All rights reserved.
//

import Foundation
import VirgilSDK
import XAsync

class AppState: NSObject {
    
    var cards = [String: VSSCard]()
    var identity: String! = nil
    var privateKey: VSSPrivateKey! = nil
    
    var appCard: VSSCard! = nil
    
    var virgil: VSSClient! = nil
    var twilio: TwilioManager! = nil
    var backend: Backend! = nil
    
    func kill() {
        self.cards = [String: VSSCard]()
        self.identity = nil
        self.privateKey = nil
        self.appCard = nil
        
        self.virgil = nil
        self.twilio = nil
        self.backend = nil
    }
    
    func initVirgil(identity: String) {
        self.identity = identity
        self.backend = Backend()
        
        let token = self.backend.getVirgilAuthToken()
        self.virgil = VSSClient(applicationToken: token)
        self.getAppCard()
        
    }
    
    func initTwilio(listeners: [TwilioListener]) {
        self.twilio = TwilioManager(listeners: listeners)
    }
    
    func cardForIdentity(identity: String, type: String = Constants.Virgil.IdentityType) -> VSSCard? {
        /// If there is card stored in local dictionary - return it.
        if let card = AppState.sharedInstance.cards[identity] {
            return card
        }
        
        /// Create async task
        let task = XAsyncTask { weakTask in
            /// Which initiates search for the card on the Virgil Service
            self.virgil.searchCardWithIdentityValue(identity, type: type, unauthorized: false) { (cards, error) in
                if error != nil {
                    print("Error getting user's card from Virgil Service: \(error!.localizedDescription)")
                    /// In case of error - mark task as fiished.
                    weakTask?.fireSignal()
                    return
                }
                
                /// Get the card from the service response if possible
                if let candidates = cards where candidates.count > 0 {
                    let card = candidates[0]
                    if let sign64 = card.data?[Constants.Virgil.VirgilPublicKeySignature] as? String, signature = NSData(base64EncodedString: sign64, options: .IgnoreUnknownCharacters) {
                        let verifier = VSSSigner()
                        do {
                            try verifier.verifySignature(signature, data: card.publicKey.key, publicKey: AppState.sharedInstance.appCard.publicKey.key, error: ())
                            weakTask?.result = card
                        }
                        catch let err as NSError {
                            print("Public key signature is invalid: \(err.localizedDescription)")
                            weakTask?.result = nil
                        }
                    }
                    else {
                        /// There is no public_key_signature in data.
                        /// Card does not contain this information - just ignore it.
                        weakTask?.result = candidates[0]
                    }
                    
                }
                /// And mark the task as finished.
                weakTask?.fireSignal()
            }
        }
        /// Perform the task body and wait until task is signalled resolved.
        task.awaitSignal()
        /// If there is card actually get from the Virgil Service
        if let card = task.result as? VSSCard {
            /// Synchronously save it in the local dictionary for futher use.
            synchronized(self.virgil, closure: {
                AppState.sharedInstance.cards[card.identity.value] = card
            })
            return card
        }
        
        return nil
    }
    
    private func getAppCard() {
        let async = XAsyncTask { (weakTask) in
            self.virgil.searchAppCardWithIdentityValue(Constants.Backend.AppBundleId, completionHandler: { (cards, error) in
                if let err = error {
                    print("Error searching for card: \(err.localizedDescription)")
                    weakTask?.fireSignal()
                    return
                }
                
                if let candidates = cards where candidates.count > 0 {
                    self.appCard = candidates[0]
                }
                
                weakTask?.fireSignal()
                return
            })
        }
        async.awaitSignal()
    }
}

// MARK: Singletone implementation
extension AppState {
    class var sharedInstance: AppState {
        struct Static {
            static var onceToken: dispatch_once_t = 0
            static var instance: AppState? = nil
        }
        dispatch_once(&Static.onceToken) {
            Static.instance = AppState()
        }
        return Static.instance!
    }
}
