/* globals gapi  */

import Quagga from '@ericblade/quagga2'
import './App.css'
import { useEffect, useRef, useState } from 'react'
import { usePersistedState } from './lib/persistantState'
import { columns, createSpreadsheets, updateSpreadsheets } from './lib/spreadsheets'
import Modal from './Modal'
import { AiOutlineClose, BiFileFind } from 'react-icons/all'
import Suggestions from './Suggestions'
import SupplyCount from './SupplyCount'

const _getMedian = (arr) => {
  arr.sort((a, b) => a - b)
  const half = Math.floor(arr.length / 2)
  if (arr.length % 2 === 1)
    // Odd length
    return arr[half]
  return (arr[half - 1] + arr[half]) / 2.0
}

const setUpQuagga = (node, setCodes) => {
  if (!node) return false
  Quagga.init(
    {
      inputStream: {
        name: 'Live',
        target: node,
        constraints: {
          width: { min: 640 },
          height: { min: 480 },
          facingMode: 'environment',
          area: {
            top: '40%', // top offset
            right: '20%', // right offset
            left: '20%', // left offset
            bottom: '40%', // bottom offset
          },
        },
        type: 'LiveStream',
      },
      locator: {
        patchSize: 'x-large',
        halfSample: true,
      },
      frequency: 2,
      numOfWorkers: 2,
      locate: true,
      decoder: {
        readers: ['ean_reader', 'ean_8_reader'],
        debug: {
          drawBoundingBox: true,
          showFrequency: true,
          drawScanline: true,
          showPattern: true,
        },
      },
    },
    function (err) {
      if (err) {
        return
      }
      console.log('Initialization finished. Ready to start')
      Quagga.start()
    }
  )
  Quagga.onDetected((data) => {
    const errors = data.codeResult.decodedCodes
      .filter((_) => _.error !== undefined)
      .map((_) => _.error)
    const median = _getMedian(errors)
    if (median < 0.15) {
      setCodes((codes) => ({
        ...codes,
        [data.codeResult.code]: codes[data.codeResult.code] || undefined,
      }))
    }
  })
}

function App() {
  const videoRef = useRef(null)
  const signIn = useRef(null)
  const signOut = useRef(null)
  const [codes, setCodes] = useState({4013307767381: undefined})
  const [spreadsheetId, setSpreadsheetId] = usePersistedState('spreadsheetId')

  const updateSpreadsheet = async () => {
    const response = await updateSpreadsheets(spreadsheetId, codes)
    if (response.status === 200) {
      setCodes({})
    }
  }

  useEffect(() => {
    if (videoRef.current) setUpQuagga(videoRef.current, setCodes)

    return Quagga.stop
  }, [videoRef])

  useEffect(() => {
    const queryCodeInfo = async () => {
      const toBeSet = {}
      await Promise.all(
        Object.keys(codes).map(async (code) => {
          const val = codes[code]

          if (!val) {
            const response = await fetch(
              `https://cors-anywhere.herokuapp.com/https://www.google.com/search?q=${code}`,
              { headers: { 'User-Agent': 'Webkit' } }
            )
            const data = await response.text()
            const parser = new DOMParser()
            const serp = parser.parseFromString(data, 'text/html')
            const titles = serp.querySelectorAll('a h3')
            toBeSet[code] = {
              suggestions: titles.length ? Array.from(titles).map((el) => el.textContent) : [],
              valueIs: 1,
              name: '',
              valueShould: 0,
            }
          }
        })
      )

      if (Object.keys(toBeSet).length) {
        setCodes({ ...codes, ...toBeSet })
      }
    }

    queryCodeInfo()
  }, [codes])

  useEffect(() => {
    const script = document.createElement('script')
    const setUpGoogleApi = () => {
      gapi.load('client:auth2', () => {
        gapi.client
          .init({
            apiKey: process.env.REACT_APP_API_KEY,
            clientId: '647451046675-qf49g1k0dtchdsol82stgo823r5r5sua.apps.googleusercontent.com',
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            scope: 'https://www.googleapis.com/auth/spreadsheets'
          })
          .then(
            function() {
              const updateSigninStatus = async (signedIn) => {
                if (signedIn) {
                  if (!spreadsheetId) {
                    const response = await createSpreadsheets()
                    if (response.status === 200) setSpreadsheetId(response.result.spreadsheetId)
                  }
                }
              }
              gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus)
              // Handle the initial sign-in state.
              updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get())

              signIn.current.onclick = () => gapi.auth2.getAuthInstance().signIn()
              signOut.current.onclick = () => gapi.auth2.getAuthInstance().signOut()
            },
            function(error) {
              console.error(JSON.stringify(error, null, 2))
            }
          )
          .catch(console.log)
      })
    }


    script.src = 'https://apis.google.com/js/api.js'
    script.async = true
    script.defer = true
    script.onload = setUpGoogleApi

    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [setSpreadsheetId, spreadsheetId])

  return (
    <div className="App" ref={videoRef}>
      <video autoPlay muted playsInline className="mb-10 bg-gray-100" />
      <div className="container mx-auto max-w-3xl bg-gray-100 p-10 overflow-auto">
        <table className="border-collapse bg-indigo-200 w-full text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th className="border-2 border-indigo-400 p-2">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(codes).map((code) => {
              const codeObj = codes[code]
              const setObj = (newValues) =>
                setCodes({ ...codes, [code]: { ...codeObj, ...newValues } })
              return codeObj ? (
                <tr key={code}>
                  <td className="border-2 border-indigo-400 p-2">{code}</td>
                  <td className="border-2 border-indigo-400 p-2">
                    <div className="flex flex-row">
                      <input
                        type="text"
                        value={codeObj?.name}
                        onChange={(e) => setObj({ name: e.target.value })}
                        className="bg-transparent rounded-none border-b border-black placeholder-gray-500 flex-grow"
                        placeholder="Name"
                      />
                      <button
                        className="ml-2"
                        onClick={() =>
                          setCodes({
                            ...codes,
                            [code]: { ...codeObj, openModal: !codeObj.openModal },
                          })
                        }
                      >
                        <BiFileFind size={25} />
                      </button>
                    </div>
                    <Modal shown={codeObj?.openModal}>
                      <button className="absolute top-5 right-5" onClick={() =>setObj({openModal: false})}><AiOutlineClose size={20} /></button>
                      {codeObj?.suggestions.length ? (
                        <Suggestions
                          suggestions={codeObj.suggestions}
                          clickHandler={(item) => setObj({ name: item, openModal: false })}
                        />
                      ) : (
                        'Nichts gefunden'
                      )}
                    </Modal>
                  </td>
                  <td className="border-2 border-indigo-400 p-2">
                    <SupplyCount
                      value={codeObj.valueShould}
                      changeHandler={(val) => setObj({ valueShould: val })}
                    />
                  </td>
                  <td className="border-2 border-indigo-400 p-2">
                    <SupplyCount
                      value={codeObj.valueIs}
                      changeHandler={(val) => setObj({ valueIs: val })}
                    />
                  </td>
                </tr>
              ) : null
            })}
          </tbody>
        </table>
        <div className="mt-4">
          <button className="p-2.5 bg-blue-100 mr-2" ref={signIn}>Anmelden</button>
          <button className="p-2.5 bg-blue-100 mr-2" ref={signOut}>Abmelden</button>
        </div>
        {
          spreadsheetId && (
          <div className="mt-4">
            <button className="p-2.5 bg-blue-400 mr-2" onClick={updateSpreadsheet}>Speichern</button>
            <a className="p-2.5 bg-blue-100 mr-2" href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=100`}>Zum Dokument</a>
          </div>
          )
        }
      </div>
    </div>
  )
}

export default App
