const nacl = require('tweetnacl');
var AWS = require('aws-sdk');
const SSM = new AWS.SSM();

const server_instance_id = "i-080713bf868816ac7"

//https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html
exports.handler = async (event, context, callback) => {
  console.log('Disabling context.callbackWaitsForEmptyEventLoop')
  context.callbackWaitsForEmptyEventLoop = false
  
  // Checking signature (requirement 1.)
  // Your public key can be found on your application in the Developer Portal
  const PUBLIC_KEY = process.env.PUBLIC_KEY;
  const signature = event.headers['x-signature-ed25519']
  const timestamp = event.headers['x-signature-timestamp'];
  const strBody = event.body; // should be string, for successful sign

  const isVerified = nacl.sign.detached.verify(
    Buffer.from(timestamp + strBody),
    Buffer.from(signature, 'hex'),
    Buffer.from(PUBLIC_KEY, 'hex')
  );
  if (!isVerified) {
    return {
      statusCode: 401,
      body: JSON.stringify('invalid request signature'),
    };
  }

  // Replying to ping (requirement 2.)
  const body = JSON.parse(strBody)
  if (body.type == 1) {
    return {
      statusCode: 200,
      body: JSON.stringify({ "type": 1 }),
    }
  }

  //-------------Start processing discord commands-------------
  const ec2 = new AWS.EC2({ region: "us-west-2" });
  var params = {
         InstanceIds: [
            server_instance_id
         ],
         DryRun: false
      };
  
  //https://masteringjs.io/tutorials/fundamentals/then
  //https://stackoverflow.com/questions/57282759/how-to-start-and-stop-ec2-instance-using-lambda
  if (body.data.name == 'mc_start'){
   return ec2.startInstances({ InstanceIds: [server_instance_id] }).promise()
      .then(() => {
        console.log("startInstances.then() invoked!")
        var resp = JSON.stringify({ 
              "type": 4,
              "data": { "content": "好噠~ 麥塊醬這就去叫實體醬起床噠 (๑•ั็ω•็ั๑)~~" }
            })
        callback(null, resp)
        //return re;
      })
      .catch(err => {
        console.log("startInstances.catch() invoked, error -> \n" + err)
        var resp = JSON.stringify({ 
              "type": 4,
              "data": { "content": 
                "阿嘟...實體醬好像不理我哪...\n" + 
                "亞麻桑是這麼跟我說噠:\n" 
                +"\`\`\`"+ err + "\`\`\`"
                + "\n要不過一分鐘再試試?"
              }
            })
        callback(null, resp)
        //return re;
    });
  }
  
  if (body.data.name == 'mc_stop'){
    return ec2.stopInstances({ InstanceIds: [server_instance_id] }).promise()
      .then(() => {
        console.log("stopInstances.then() invoked!")
        var resp = JSON.stringify({ 
              "type": 4,
              "data": { "content": "好噠~ 這就讓實體醬去睡覺覺噠~" }
            })
        callback(null, resp)
        //return re;
      })
      .catch(err => {
        console.log("stopInstances.catch() invoked, error -> \n" + err)
        var resp = JSON.stringify({ 
              "type": 4,
              "data": { "content": 
                "阿內...好像哪裡出錯了哪...\n" + 
                "亞麻桑是這麼跟我說噠...\n" 
                +"\`\`\`"+ err + "\`\`\`"
              }
            })
        callback(null, resp)
        //return re;
    });
  }
  
  if (body.data.name == 'mc_backup'){
    const instanceIdList = [server_instance_id];
    const cmd = ["cd /home/ubuntu/mc", "./auto_backup.sh"];
    console.log('Sending commands to instances:');
    console.log(instanceIdList, cmd);
    
    try{
      const commandResults = await sendCommands(instanceIdList, cmd);
       return JSON.stringify({ 
              "type": 4,
              "data": { "content": "恩恩好噠~ 這就去跟實體醬說噠~~" }
       });
    }catch (err) {
      console.log('sendCommands failed', err);
      return JSON.stringify({ 
              "type": 4,
              "data": { "content": "阿嘟...好像沒法聯絡到實體醬唉... \n 亞麻桑是這這麼說噠: \n" 
              +"\`\`\`" +err +"\`\`\`"}
       });
    }
  }
  
  console.log("Code end reach");
   // If no handler implemented for Discord's request
  return JSON.stringify({ 
              "type": 4,
              "data": { "content": "你在說甚麼麥塊醬聽不懂噠~~" }
  })
};



/*
return JSON.stringify({ 
              "type": 4,
              "data": { "content": "Starting mc server...2" }
            })
*/

function sendCommands(instanceIdList, cmd) {
  return new Promise(function(resolve, reject) {
    const params = {
      InstanceIds: instanceIdList,
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: cmd,
      },
    };
    SSM.sendCommand(params, function(err, data) {
      if (err) {
        console.log(err);
        reject(err);
      }
      resolve(data);
    });
  });
}
