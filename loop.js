// node myFile.js

const pendingTimers = [] // setTimeout, timer stuff
const pendingOSTasks = [] // networking stuff
const pendingOperations = [] // filesystem stuff

// New timers, tasks, operations are recorded from myFile running
myFile.runContents()

function shouldContinue() {
	// Check one  : Any pending setTimeout, setInterval, setImmediate?
	// Check two  : Any pending OS tasks? (Like server listening to port)
	// Check three: Any pending long running operations? (Like fs module)

	return (
		pendingTimers.length ||
		pendingOSTasks.length ||
		pendingOperations.length
	)
}

// Entire body executes in one 'tick' (tick -> one loop execution)
while (shouldContinue()) {
	/*
    1) Node looks at pendingTimers and sees if any functions are ready to be called. setTimeout, setInterval
         a) runs expired timers callbacks


    2) Node looks at pendingOSTasks and pendingOperations and calls relevant callbacks
         a) pendingOSTasks    -> some request comes into some ports at which a server is listening on
         b) pendingOperations -> some file is successfully retrieve from our harddrive

         during this stage node will detect that those things have been completed and will call
         the relevant callbacks like callback to handle incomming request

    3) Pause execution(temporarily). Continue when...(whenever some number of events occur)
         a) a new pendingOSTask is done
         b) a new pendingOperation is done
         c) a timer is about to complete
         (gives time to finish callback functions or wait for timer)

    4) Look at pendingTimers. Call any setImmediate

    5) Handle any 'close' events
         a) readStream.on('close', () => {
               console.log('Cleanup code.');
            })
         b) terminate any open file
         c) terminates any running server

   */
}

// exit back to terminal

/* *********************************************************************************************************************************** */

/*
      Node Event Loop                     --------------------->     Single Threaded
      Some of Node Framework/Std Lib      --------------------->     Not Single Threaded


      Like pbkdf2 function available in crypto module does not run in single thread. It uses multithreading of
      Node's C++ side (libuv) i.e. Thread Pool (by default there are four threads inside thread pool). We can
      manupluate number of threads to use for any core node function that uses multithreading by

      process.env.UV_THREADPOOL_SIZE = <number-of-threads>
         e.g. process.env.UV_THREADPOOL_SIZE = 6

      Here lets us take process.env.UV_THREADPOOL_SIZE = 4, then

                                                   Javascript Code We Write
                                                               |
                                                               |
                                                            pbkdf2             -------> Node's crypto Module
                                                               |
                                                               |
                                                              *V8*
                                                               |
                                                               |
                                                         Nodo's C++ Side
                                                               |
                                                               |
                                                    ________________________
                                                   |         libuv          |
                                                   |         ____________   |
                                                   | thread | #1  |  #2  |  |
                                                   |  pool  |_____|______|  |
                                                   |        | #3  |  #4  |  |
                                                   |        |_____|______|  |
                                                   |________________________|


         Here if we run some heavy hashing 2 times then it will not wait for first to finish but it will be assigned
         to other thread which is ready to work. Hence for 4 pbkdf2 function calls they will run concurrently in 4 threads,
         but if 5 heavy pbkdf2 function is called when 4 threads is available then 4 functions call are called using 4 threads
         and last call will have to wait for a thread (any one of 4 threads) to be ready.

         but here performance will not be as good as when we run one functional call with one thread because one core might be
         handling two threads hence it has to do more work to finish it.



             __________________Questions_____________________________________________Answers_____________________________
            |                                            ||                                                              |
            |  Can we use the threadpool for Javascript  ||  We can write custom JS that uses the thread pool            |
            |  code or can only nodeJS functions use it. ||                                                              |
            |                                            ||                                                              |
            |  What functionss in node std library       ||  All 'fs' modules functions. Some crypto stuff. Depends      |
            |  use the threadpool?                       ||  on OS (windows vs unix based)                               |
            |                                            ||                                                              |
            |  How does this threadpool stuff fit        ||  Tasks running in the threadpool are the 'pendingOperations' |
            |  into event loop                           ||  in our code example.                                        |
            |____________________________________________||______________________________________________________________|




            Useful articles
            https://medium.com/@pkostohrys/nodejs-worker-threads-24155706765

            https://blog.logrocket.com/a-complete-guide-to-threads-in-node-js-4fa3898fe74f/

            Cluster vs Worker Threads

            There are two ways of optimizing the performance of our nodejs application

            1) Cluster
               -> e.g. By default nodejs app runs on single thread even if you have 4,8 core processor. Let's say you have 4 core CPU
                       If we want to increase handle more traffic we can run 4 instances of our app in 4 cores of our CPU and hence
                       we can handle 4 times the traffic before.
                       i)   Each process has it's own memory with it's own Node(v8) instance.
                       ii)  One process is launched on each CPU

                       It can be done by using `cluster` module from node
                       and calling cluster.fork() each time will run a new instance of nodejs app in different core

                        cluster.js
                        const cluster = require('cluster')


                        if(cluster.isMaster){
                           const cpuCount = require('os').cpus().length

                           create worker for each CPU
                           for(let i=0;i< cpuCount; i++){
                              cluster.fork()
                           }

                           Listen to dying worker and create a new worker again
                           cluster.on('exit', function(){
                              cluster.fork()
                           })


                        }

                        cluster.fork() when run it will run main index.js on new instance
                        so isMasetr will be falsed for other previous instance where index.js
                        might be running


            2) Worker Thread
               -> Previously worker threads was not available in nodejs but after version 10 it is available. It allows us to use
                  threadpool. Internally threadpool is mainly used by modules such as fs (I/0-heavy) or crypto (CPU-heavy). Worker
                  pool is implemented in libuv, which results in a slight delay whenever Node needs to communicate internally]
                  between Javascript and C++, but this is hardly noticeable

                  It can be done by using `worker_threads` module from node
                  we can communicate with running threads via onmessage and postMessage

                  **index.js**

                  const express = require('express')
                  const { Worker, isMainThread } = require('worker_threads')

                  const app = express()

                  app.get('/', (req, res) => {
                     if (isMainThread) {
                        const worker = new Worker('./worker.js')

                        worker.on('message', message => {
                           console.log(message)
                           res.json(message)
                        })
                     }

                  })

                  app.listen(3000)

                  **worker.js**

                  const { workerData, parentPort } = require('worker_threads')

                  function count() {
                     let counter = 0
                     while (counter < 1e9) {
                        counter++
                     }
                     return counter
                  }

                  parentPort.postMessage(count())



Santosh Subedi
FullStack Developer At Burgeon

*/
