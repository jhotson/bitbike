import {
    // Spinner,
    Box,
    // Flex,
    Card,
    Button,
    Image,
    // Input,
    Text,
    Heading,
    Divider,
    NavLink,
    Grid ,
  } from 'theme-ui'
import {contractAddress} from '../constants/address'

const Token = (data) => {
    // console.log(data.meta)
    return(
    <Card variant="nft">
      <Image
        sx={{ width: '30%', bg: 'white', borderBottom: '1px solid black' }}
        src={`https://${data.meta.image}`}
      />
      <Box p={3} pt={2}>
        <Heading as="h2">{data.meta.name}</Heading>
        <Divider variant="divider.nft" />
        <Grid gap={2} columns={[2, null, 4]}>
            <Box mt={2}>
              <Text as="p" sx={{ color: 'lightBlue', fontSize: 1, fontWeight: 'bold' }}>
                Token Id
              </Text>
              <Text as="p" sx={{ color: 'lightBlue', fontSize: 1, fontWeight: 'bold' }}>
                {data.meta.id}
              </Text>
            </Box>
            <Box mt={2}>
              <Text as="p" sx={{ color: 'lightBlue', fontSize: 1, fontWeight: 'bold' }}>
                Description
              </Text>
              <Text as="p" sx={{ color: 'lightBlue', fontSize: 1, fontWeight: 'bold' }}>
                {data.meta.description}
              </Text>
            </Box>
            <Box mt={2}>
              <Text as="p" sx={{ color: 'lightBlue', fontSize: 1, fontWeight: 'bold' }}>
                {data.meta.attributes[0].trait_type}
              </Text>
              <Text as="p" sx={{ color: 'lightBlue', fontSize: 1, fontWeight: 'bold' }}>
                {data.meta.attributes[0].value}
              </Text>
            </Box>
            <Box mt={2}>
              <Text as="p" sx={{ color: 'lightBlue', fontSize: 1, fontWeight: 'bold' }}>
                {data.meta.attributes[1].trait_type}
              </Text>
              <Text as="p" sx={{ color: 'lightBlue', fontSize: 1, fontWeight: 'bold' }}>
                {data.meta.attributes[1].value}
              </Text>
            </Box>
            <Box mt={2}>
              <Text as="p" sx={{ color: 'lightBlue', fontSize: 1, fontWeight: 'bold' }}>
                Owner
              </Text>
              <NavLink
                target="_blank"
                href={`https://ropsten.etherscan.io/address/${data.walletAddress}`}
                variant="owner"
                style={{
                  textOverflow: 'ellipsis',
                  width: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {data.walletAddress}
              </NavLink>
            </Box>
            <Box mt={2}>
                <Text as="p" sx={{ color: 'lightBlue', fontSize: 1, fontWeight: 'bold' }}>
                    View on
                </Text>
                <NavLink
                target="_blank"
                href={`https://testnets.opensea.io/assets/${contractAddress}/${data.meta.id}`}
                variant="openSea"
                >
                Opensea.io
                </NavLink>
            </Box>
            <Box mt={2}>
                {data.meta.attributes[0].value==="Pack"?
                <Button variant='secondary' style={{
                    backgroundColor: "blue",
                    width: '100px',
                    position: 'relative',
                    overflow: 'hidden',
                  }} onClick={()=>data.burn(data.meta.id, data.meta.attributes[1].value)}>Burn</Button>
                  :
                  <Button variant='secondary' style={{
                    backgroundColor: "Yellow",
                    width: '100px',
                    position: 'relative',
                    overflow: 'hidden',
                  }} onClick={()=>data.burn(data.meta.id, "")}>Burn</Button>
                }

                
            </Box>
        </Grid>
          {/* <Flex mt={3} sx={{ justifyContent: 'center', width: '100%' }}>
            <Button
              onClick={onBuyClick}
              variant="quartiary"
            >
              Buy Token
            </Button>
          </Flex> */}
      </Box>
    </Card>
    )
}

export default Token