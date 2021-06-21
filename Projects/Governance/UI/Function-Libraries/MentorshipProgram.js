function newGovernanceFunctionLibraryMentorshipProgram() {
    let thisObject = {
        calculate: calculate
    }

    return thisObject

    function calculate(
        pools,
        userProfiles
    ) {
        /*
        Here we will store the total amount of tokens that is going to be distributed among all participants
        of the Mentorship Program. This will come from a Pool that is configured wiht a codeName config property
        with the value "Mentorship-Program"
        */
        let mentorshipProgramPoolTokenReward
        /*
        In order to be able to calculate the share of the Mentorships Program Pool for each User Profile,
        we need to accumulate all the Icomming Mentorship Power that each User Profile at their Mentorship Program
        node has, because with that Incoming Power is that each Mentorship Program node gets a share of 
        the pool.
         */
        let accumulatedIncomingMentorshipPower = 0

        /* Scan Pools Until finding the Mentoship-Program Pool */
        for (let i = 0; i < pools.length; i++) {
            let poolsNode = pools[i]
            mentorshipProgramPoolTokenReward = UI.projects.governance.utilities.pools.findPool(poolsNode, "Mentorship-Program")
        }
        if (mentorshipProgramPoolTokenReward === undefined || mentorshipProgramPoolTokenReward === 0) { return }
        /*
        We will first reset all the mentorship outgoingPower, and then distribute it.
        */
        for (let i = 0; i < userProfiles.length; i++) {
            let userProfile = userProfiles[i]

            if (userProfile.tokenSwitch === undefined) { continue }
            if (userProfile.tokenSwitch.mentorshipProgram === undefined) { continue }
            if (userProfile.tokenSwitch.mentorshipProgram.payload === undefined) { continue }

            reserMentorshipProgram(userProfile.tokenSwitch.mentorshipProgram)
        }
        for (let i = 0; i < userProfiles.length; i++) {
            let userProfile = userProfiles[i]

            if (userProfile.tokenSwitch === undefined) { continue }
            if (userProfile.tokenSwitch.mentorshipProgram === undefined) { continue }
            if (userProfile.tokenSwitch.mentorshipProgram.payload === undefined) { continue }

            distributeMentorshipProgram(userProfile.tokenSwitch.mentorshipProgram)
        }
        for (let i = 0; i < userProfiles.length; i++) {
            let userProfile = userProfiles[i]

            if (userProfile.tokenSwitch === undefined) { continue }
            if (userProfile.tokenSwitch.mentorshipProgram === undefined) { continue }
            if (userProfile.tokenSwitch.mentorshipProgram.payload === undefined) { continue }

            calculateMentorshipProgram(userProfile.tokenSwitch.mentorshipProgram)
        }

        function reserMentorshipProgram(node) {
            if (node === undefined) { return }
            if (node.payload === undefined) { return }
            node.payload.mentorshipProgram = {
                count: 0,
                outgoingPower: 0,
                ownPower: 0,
                incomingPower: 0,
                awarded: {
                    tokens: 0,
                    percentage: 0
                }
            }
            if (
                node.type === 'User Profile' &&
                node.tokenSwitch !== undefined
            ) {
                reserMentorshipProgram(node.tokenSwitch)
                return
            }
            if (
                node.type === 'Token Switch' &&
                node.mentorshipProgram !== undefined
            ) {
                reserMentorshipProgram(node.mentorshipProgram)
                return
            }
            if (
                node.type === 'Mentorship Program' &&
                node.userMentors !== undefined
            ) {
                for (let i = 0; i < node.userMentors.length; i++) {
                    reserMentorshipProgram(node.userMentors[i])
                }
                return
            }
            if (
                node.type === 'User Mentor' &&
                node.payload.referenceParent !== undefined
            ) {
                reserMentorshipProgram(node.payload.referenceParent)
                return
            }
        }

        function distributeMentorshipProgram(mentorshipProgram) {
            if (mentorshipProgram === undefined || mentorshipProgram.payload === undefined) { return }
            /*
            Here we will convert Token Power into Mentorship Power. 
            As per system rules mentoshipPower = tokensPower
            */
            let mentoshipPower = mentorshipProgram.payload.tokenPower
            /*
            We will also reseet the count of mentorships here.
            */
            let count = 0
            /*
            The Own Power is the power generated by the same User Profile tokens, not inherited from others.
            */
            mentorshipProgram.payload.mentorshipProgram.ownPower = mentoshipPower

            distributeMentorshipPower(mentorshipProgram, mentoshipPower, count)
        }

        function distributeMentorshipPower(
            node,
            mentoshipPower,
            count
        ) {
            if (node === undefined) { return }
            if (node.payload === undefined) { return }
            if (node.payload.mentorshipProgram === undefined) { return }

            switch (node.type) {
                case 'Mentorship Program': {
                    /*
                    This is the point where we increase to our local count of mentorships whatever it comes
                    at the count parameters. If we are processing the User Profile of this Mentorship Program
                    then we will add zero, otherwise, 1.
                    */
                    node.payload.mentorshipProgram.count = node.payload.mentorshipProgram.count + count
                    /*
                    The outgoingPower of this node will be accumulating all the mentoshipPower flowing
                    through it, no matter from where it comes. 
                    */
                    node.payload.mentorshipProgram.outgoingPower = node.payload.mentorshipProgram.outgoingPower + mentoshipPower
                    /*
                    We need to adjust the balance that holds the accumulationt of all incomingPower of all Mentorship Program
                    nodes. To do this we will substratct the current incomingPower, bacause it is going to be recalculated
                    inmediatelly after this, and then we will add it again after the recalcualtion.
                    */
                    accumulatedIncomingMentorshipPower = accumulatedIncomingMentorshipPower - node.payload.mentorshipProgram.incomingPower
                    /*
                    At any point in time, the incomingPower will be equal to the total of the outgoingPower minus
                    the ownPower. This is like this because the outgoingPower is the accumulation of all the 
                    power flow that is leaving this node, which includes the ownPower. That means that if we 
                    substract the ownPower, we will have the accumulation of all the incomingPower, which 
                    means all the power coming from other User Profiles referencing this one.
                    */
                    node.payload.mentorshipProgram.incomingPower = node.payload.mentorshipProgram.outgoingPower - node.payload.mentorshipProgram.ownPower
                    /*
                    Now that we have the incomingPower calculated again, we can add it again to the balance of all the incomingPower
                    of all Mentorship Program nodes.
                    */
                    accumulatedIncomingMentorshipPower = accumulatedIncomingMentorshipPower + node.payload.mentorshipProgram.incomingPower

                    if (node.userMentors !== undefined) {
                        for (let i = 0; i < node.userMentors.length; i++) {
                            distributeMentorshipPower(node.userMentors[i], mentoshipPower / node.userMentors.length, 0)
                        }
                    }
                    break
                }
                case 'User Mentor': {
                    node.payload.mentorshipProgram.outgoingPower = node.payload.parentNode.payload.mentorshipProgram.outgoingPower / node.payload.parentNode.userMentors.length

                    drawUserMentor(node)
                    if (node.payload.referenceParent !== undefined) {
                        distributeMentorshipPower(node.payload.referenceParent, mentoshipPower / 10, 0)
                    }
                    break
                }
                case 'User Profile': {
                    if (node.tokenSwitch !== undefined) {
                        distributeMentorshipPower(node.tokenSwitch, mentoshipPower, 0)
                    }
                    break
                }
                case 'Token Switch': {
                    if (node.mentorshipProgram !== undefined) {
                        distributeMentorshipPower(node.mentorshipProgram, mentoshipPower, 1)
                    }
                    break
                }
            }
        }

        function calculateMentorshipProgram(mentorshipProgram) {
            /*
            Here we will calculate which share of the Mentorship Program Pool this user will get in tokens.
            To do that, we use the incomingPower, to see which proportion of the accumulatedIncomingMentorshipPower
            represents.
            */
            if (mentorshipProgram.payload === undefined) { return }
            /*
            If the accumulatedIncomingMentorshipPower is not grater the amount of tokens at the Mentorship Program Pool, then
            this user will get the exact amount of tokens from the pool as incomingPower he has. 

            If the accumulatedIncomingMentorshipPower is  grater the amount of tokens at the Mentorship Program Pool, then
            the amount ot tokens to be received is a proportional to the share of incomingPower in accumulatedIncomingMentorshipPower.
            */
            let totalPowerRewardRatio = accumulatedIncomingMentorshipPower / mentorshipProgramPoolTokenReward
            if (totalPowerRewardRatio < 1) { totalPowerRewardRatio = 1 }

            if (mentorshipProgram.tokensAwarded === undefined || mentorshipProgram.tokensAwarded.payload === undefined) {
                mentorshipProgram.payload.uiObject.setErrorMessage("Tokens Awarded Node is needed in order for this Program to get Tokens from the Mentorship Program Pool.")
                return
            }
            mentorshipProgram.payload.mentorshipProgram.awarded.tokens = mentorshipProgram.payload.mentorshipProgram.incomingPower * totalPowerRewardRatio
            /*
            As per the system rules, the Mentorship Program will not give tokens to users that do not ha their own Referrer set up,
            unless it has a big amount of tokens (this last condition is for the edge case where a user it at the top of the 
            mentorship pyramid.)        
            */
            if (
                mentorshipProgram.payload.mentorshipProgram.awarded.tokens > 0 &&
                mentorshipProgram.payload.mentorshipProgram.ownPower < 1000000 &&
                (mentorshipProgram.userMentors === undefined || hasUsersDefined(mentorshipProgram.userMentors) === false)
            ) {

                mentorshipProgram.payload.uiObject.setErrorMessage("In order to be awarded " + mentorshipProgram.payload.mentorshipProgram.awarded.tokens + " SA Tokens from your mentorships, you need first to define yourself who your metors are.")
                mentorshipProgram.payload.mentorshipProgram.awarded.tokens = 0
            }

            drawMentorshipProgram(mentorshipProgram)
        }

        function hasUsersDefined(usersArray) {
            if (usersArray === undefined) { return false }
            for (let i = 0; i < usersArray.length; i++) {
                let user = usersArray[i]
                if (user.payload.referenceParent !== undefined) { return true }
            }
            return false
        }

        function drawUserMentor(node) {
            if (node.payload !== undefined) {

                const outgoingPowerText = new Intl.NumberFormat().format(node.payload.mentorshipProgram.outgoingPower)

                node.payload.uiObject.valueAngleOffset = 180
                node.payload.uiObject.valueAtAngle = true

                node.payload.uiObject.setValue(outgoingPowerText + ' ' + 'Mentorship Power')

                node.payload.uiObject.statusAngleOffset = 0
                node.payload.uiObject.statusAtAngle = false

                node.payload.uiObject.setStatus(outgoingPowerText + ' ' + ' Outgoing Power')
            }
        }

        function drawMentorshipProgram(node) {
            if (node.payload !== undefined) {

                const ownPowerText = new Intl.NumberFormat().format(node.payload.mentorshipProgram.ownPower)
                const incomingPowerText = new Intl.NumberFormat().format(node.payload.mentorshipProgram.incomingPower)

                node.payload.uiObject.statusAngleOffset = 0
                node.payload.uiObject.statusAtAngle = false

                node.payload.uiObject.setStatus(ownPowerText + ' Own Power - ' + incomingPowerText + ' Incoming Power')
            }
            if (node.tokensAwarded !== undefined && node.tokensAwarded.payload !== undefined) {

                const tokensAwardedText = new Intl.NumberFormat().format(node.payload.mentorshipProgram.awarded.tokens)

                node.tokensAwarded.payload.uiObject.statusAngleOffset = 0
                node.tokensAwarded.payload.uiObject.statusAtAngle = false
                node.tokensAwarded.payload.uiObject.valueAngleOffset = 0
                node.tokensAwarded.payload.uiObject.valueAtAngle = false

                node.tokensAwarded.payload.uiObject.setValue(tokensAwardedText + ' SA Tokens')
                node.tokensAwarded.payload.uiObject.setStatus('From ' + node.payload.mentorshipProgram.count + ' Mentees.')
            }
        }
    }
}