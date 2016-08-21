//
//  TwilioManager.swift
//  VirgilTwilioChat
//
//  Created by Pavel Gorb on 8/21/16.
//  Copyright © 2016 Virgil Security, Inc. All rights reserved.
//

import Foundation
import UIKit

protocol TwilioListener: class {
    
}

protocol TwilioChannelsListener: TwilioListener {
    
    func channelListDidComplete()
    func channelDidRemove()
}

protocol TwilioMessageListener: TwilioListener {
    
    func didAddMessage(_: TWMMessage)
}

class TwilioManager: NSObject {

    private var twilio: TwilioIPMessagingClient! = nil
    var listeners = Array<TwilioListener>()

    init(listeners: [TwilioListener]) {
        super.init()
     
        self.listeners.appendContentsOf(listeners)
        
        let token = AppState.sharedInstance.backend.getTwilioToken(AppState.sharedInstance.identity, device: UIDevice.currentDevice().identifierForVendor!.UUIDString)
        let accessManager = TwilioAccessManager.init(token: token, delegate: nil)
        self.twilio = TwilioIPMessagingClient.ipMessagingClientWithAccessManager(accessManager, properties: nil, delegate: self)
    }
    
    override convenience init() {
        self.init(listeners: [])
    }
    
    func addListener(candidate: TwilioListener) {
        for listener in self.listeners {
            if listener === candidate {
                return
            }
        }
        
        self.listeners.append(candidate)
    }

    func removeListener(candidate: TwilioListener) {
        var index: Int = 0;
        while index < self.listeners.count {
            let listener = self.listeners[index]
            if listener === candidate {
                break
            }
            index += 1
        }
        
        if index == self.listeners.count {
            return
        }
        
        self.listeners.removeAtIndex(index)
    }
    
    func removeAllListeners() {
        self.listeners.removeAll()
    }
    
    func getChannelsList() -> [TWMChannel] {
        guard let channels = self.twilio.channelsList().allObjects() where channels.count > 0 else {
            return []
        }
        return channels
    }
    
    func sendMessage() {
    
    }
}

extension TwilioManager: TwilioIPMessagingClientDelegate {

    func ipMessagingClient(client: TwilioIPMessagingClient!, synchronizationStatusChanged status: TWMClientSynchronizationStatus) {
        if status == .ChannelsListCompleted {
            for listener in self.listeners {
                if let channelListener = listener as? TwilioChannelsListener {
                    channelListener.channelListDidComplete()
                }
            }
        }
    }
    
    // Called whenever a channel we've joined receives a new message
    func ipMessagingClient(client: TwilioIPMessagingClient!, channel: TWMChannel!, messageAdded message: TWMMessage!) {
        for listener in self.listeners {
            if let channelListener = listener as? TwilioMessageListener {
                channelListener.didAddMessage(message)
            }
        }
        
//        if let encrypted = NSData(base64EncodedString: message.body, options: .IgnoreUnknownCharacters) {
//            self.decryptAndCacheMessage(encrypted)
//            dispatch_async(dispatch_get_main_queue()) {
//                self.tableView.reloadData()
//            }
//        }
    }
    
}