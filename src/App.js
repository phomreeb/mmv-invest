import React, { Component } from 'react'
import {
  ChakraProvider,
  Box,
  VStack,
  Grid,
  theme,
  Tag,
  HStack,
  // StackDivider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Image,
  Text,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  // ModalCloseButton,
  ModalBody,
  ModalFooter,
  Input,
} from '@chakra-ui/react';
import { ColorModeSwitcher } from './ColorModeSwitcher';
import Web3 from 'web3'
import ContractAddress from './abi/addressContract.json'
import MMVABI from './abi/mmv.json'
import KKUBABI from './abi/kkub.json'
import LUMIABI from './abi/lumi.json'


export default class App extends Component {

  web3ReadData = new Web3('https://rpc.bitkubchain.io')
  web3Metamask = new Web3(window.ethereum)
  MMVContract = new this.web3ReadData.eth.Contract(MMVABI, ContractAddress.MMVNFT)
  KKUBContract = new this.web3ReadData.eth.Contract(KKUBABI, ContractAddress.kkub)
  LUMIContract = new this.web3ReadData.eth.Contract(LUMIABI, ContractAddress.lumi)
  MMVMetamaskContract = new this.web3Metamask.eth.Contract(MMVABI, ContractAddress.MMVNFT)

  constructor(props) {
    super(props)
    this.state = {
      account: "",
      kub: 0,
      kkub: 0,
      lumi: 0,
      flowerPrice: 0,
      gemstonePrice: 0,
      allnft: [],
      amountnft: 0,
      idModelOpen: false,
      transferTokenId: "",
      transferTokenName: "",
      transferTokenImage: "",
      transferTokenTraitType: "",
      transferTokenValue: "",
      transferTo: ""

    }

  }

  async componentDidMount() {
    if (typeof window.ethereum !== 'undefined') {
      console.log('MetaMask is installed!');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      if (this.state.account !== accounts[0]) {
        this.setState({ account: accounts[0] })
      }
      // console.log('account :', this.state.account)

      const balanceKUB = await this.web3ReadData.eth.getBalance(this.state.account)
      const balanceKKUB = await this.KKUBContract.methods.balanceOf(this.state.account).call()
      const balanceLUMI = await this.LUMIContract.methods.balanceOf(this.state.account).call()
      const totalnft = await this.MMVContract.methods.balanceOf(this.state.account).call()
      this.setState({
        kub: parseFloat(this.web3ReadData.utils.fromWei(balanceKUB, 'ether')).toFixed(4),
        kkub: parseFloat(this.web3ReadData.utils.fromWei(balanceKKUB, 'ether')).toFixed(4),
        lumi: parseFloat(this.web3ReadData.utils.fromWei(balanceLUMI, 'ether')).toFixed(4),
        amountnft: totalnft
      })
      // console.log(parseFloat(this.web3ReadData.utils.fromWei(balanceKKUB, 'ether')).toFixed(4), 'KKUB')
      this.testNFT()
      await this.loadNFT(this.state.account)
      console.log(this.state.allnft)
    } else {
      alert('Please install Metamask')
    }
  }

  testNFT() {
    console.log('Test use nft')
    fetch('https://bkcscan.com/api?module=contract&action=getabi&address=0xA2801e5Ab284851822FC20f3D655953899d22545')
      .then(response => response.json())
      .then(data => {
        console.log(data.status)
        console.log(data.result)
      })
  }

  async loadNFT(address) {
    this.setState({allnft: []})
    console.log('load nft data')
    var result = {
      "flower": 0,
      "gemstone": 0
    }
    let listnft = await this.MMVContract.methods.tokenOfOwnerAll(address).call()
    let list = []
    for (let tokenId of listnft) {
      let url = await this.MMVContract.methods.tokenURI(tokenId).call()
      await fetch(url)
        .then(response => response.json())
        .then(data => {
          data['tokenId'] = tokenId
          if (data.attributes[1].value === 'Flower') {
            result['flower'] = result['flower'] + (data.attributes[4].value/100)
            // this.setState({flowerPrice: this.state.flowerPrice + (data.attributes[4].value/100)})
          }
          if (data.attributes[1].value === 'Gemstone') {
            let ch = data.attributes.length
            result['gemstone'] = result['gemstone'] + (data.attributes[ch-1].value/100)
            // this.setState({gemstonePrice: this.state.gemstonePrice + (data.attributes[ch-1].value/100)})
          }
          list.push(data)
          this.setState({allnft: list})
        }
      )
      // console.log(result['flower'],result['gemstone'])
      // console.log(this.state.allnft.length)
    }

    this.setState({
      flowerPrice: parseFloat(result['flower']).toFixed(4),
      gemstonePrice: parseFloat(result['gemstone']).toFixed(4)
    })
  }

  async openTransfer(detail) {
    // console.log(detail)
    await this.setState({
      idModelOpen: true,
      transferTokenName: detail.name,
      transferTokenId: detail.tokenId,
      transferTokenImage: detail.image,
      transferTokenTraitType: detail.attributes[detail.attributes.length-1]['trait_type'],
      transferTokenValue: detail.attributes[detail.attributes.length-1]['value']
    })
  }

  closeTransfer() {
    this.setState({idModelOpen: false})
  }

  async transferNFT() {
    console.log(this.state.transferTo)
    if (this.state.transferTo !== this.state.account) {
      console.log("send nft")
      let tranfer = await this.MMVMetamaskContract.methods
        .transferFrom(this.state.account, this.state.transferTo, this.state.transferTokenId)
        .send({from: this.state.account})
      const totalnft = await this.MMVContract.methods.balanceOf(this.state.account).call()
      this.setState({amountnft: totalnft})
      console.log(tranfer)
      this.closeTransfer()
    } else {
      alert("Don't send NFT to your address!")
    }
  }

  render() {
    return (
      <ChakraProvider theme={theme}>
        <Box textAlign="right" bg="teal" w="100%" p={2}>
          <Tag m={1} size="lg" borderRadius="full">{this.state.account}</Tag>
          <ColorModeSwitcher justifySelf="flex-end" />
        </Box>
        <Box textAlign="center" fontSize="xl">
          <Grid p={3}>
            <VStack spacing={8}>
              <HStack spacing="24px">
                <Box w='200px' boxShadow="dark-lg" p="2" rounded="md">
                  <Stat>
                    <StatLabel>KUB</StatLabel>
                    <StatNumber>{parseFloat(this.state.kub)+parseFloat(this.state.kkub)}</StatNumber>
                    <StatHelpText>
                      Coming soon
                    </StatHelpText>
                  </Stat>
                </Box>
                <Box w='200px' boxShadow="dark-lg" p="2" rounded="md">
                  <Stat>
                    <StatLabel>LUMI</StatLabel>
                    <StatNumber>{this.state.lumi}</StatNumber>
                    <StatHelpText>
                      Coming soon
                    </StatHelpText>
                  </Stat>
                </Box>
                <Box w='200px' boxShadow="dark-lg" p="2" rounded="md">
                  <Stat>
                    <StatLabel>Flower</StatLabel>
                    <StatNumber>{this.state.flowerPrice}</StatNumber>
                    <StatHelpText>
                      Coming soon
                    </StatHelpText>
                  </Stat>
                </Box>
                <Box w='200px' boxShadow="dark-lg" p="2" rounded="md">
                  <Stat>
                    <StatLabel>Gemstone</StatLabel>
                    <StatNumber>{this.state.gemstonePrice}</StatNumber>
                    <StatHelpText>
                      Coming soon
                    </StatHelpText>
                  </Stat>
                </Box>
              </HStack>
              <Text fontSize="md">Your NFT : {this.state.allnft.length}/{this.state.amountnft}</Text>
              <SimpleGrid
                w="1080px"
                columns={{ sm: 2, md: 4 }}
                spacing="8"
                p="10"
                textAlign="center"
                rounded="lg"
                color="gray.400"
              >
                {
                  this.state.allnft.map((detail, i) => 
                  <Box textAlign="center" key={i} boxShadow="outline" p="6" rounded="md">
                    <VStack>
                      <Image w="60px" h="60px" src={detail.image} alt={detail.name} />
                      <Text fontSize="md">{detail.name}</Text>
                      <Text fontSize="sm">{detail.attributes[detail.attributes.length-1]['trait_type']} : {detail.attributes[detail.attributes.length-1]['value']}</Text>
                      <Button 
                        colorScheme="teal" 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {this.openTransfer(detail)}}
                      >
                        Transfer
                      </Button>
                    </VStack>
                  </Box>
                  )
                }
              </SimpleGrid>

              <Modal 
                isCentered 
                closeOnOverlayClick={false} 
                isOpen={this.state.idModelOpen} 
                onClose={!this.state.idModelOpen}
              >
                {/* <ModalOverlay /> */}
                <ModalContent>
                  <ModalHeader>Transfer your NFT</ModalHeader>
                  <ModalBody pb={6}>
                    <VStack>
                      <Image w="80px" h="80px" src={this.state.transferTokenImage} alt={this.state.transferTokenName} />
                      <Text fontSize="md">{this.state.transferTokenName}</Text>
                      <Text fontSize="md">{this.state.transferTokenTraitType} : {this.state.transferTokenValue}</Text>
                      <Input 
                        placeholder="To address" 
                        size="sm"
                        onChange={(e) => this.setState({transferTo: e.target.value})}
                      />
                      <Button
                        colorScheme="teal"
                        variant="outline"
                        size="sm"
                        w="200px"
                        m={3}
                        disabled={this.state.transferTo.length!==42}
                        onClick={(e) => {this.transferNFT()}}
                      >
                        Transfer
                      </Button>
                    </VStack>
                  </ModalBody>
                  <ModalFooter>
                    <Button onClick={(e) => {this.closeTransfer()}}>Close</Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
              {/* <VStack
                divider={<StackDivider borderColor="gray.200" />}
                spacing={4}
                align="stretch"
              >
                {
                  this.state.allnft.map((detail, i) => 
                  <Box key={i} w="960px" h="40px" bg="yellow.200">
                    1
                  </Box>
                  )
                }
              </VStack> */}
              
            </VStack>
          </Grid>
        </Box>
      </ChakraProvider>
    )
  }
}
